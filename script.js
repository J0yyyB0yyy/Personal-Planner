// ============================================================
// STATE
// ============================================================

let tasks = [];

try {
    const parsed = JSON.parse(localStorage.getItem("tasks"));
    tasks = Array.isArray(parsed)
        ? parsed.filter(task => task && typeof task === "object" && !Array.isArray(task))
        : [];
} catch {
    tasks = [];
}

let recurringTemplates = [];

try {
    const parsed = JSON.parse(localStorage.getItem("recurringTemplates"));
    recurringTemplates = Array.isArray(parsed) ? parsed : [];
} catch {
    recurringTemplates = [];
}

tasks.forEach(function (t) {
    t.id ??= makeId();
});

let currentFilter = "all";
let currentPriorityFilter = "all";
let currentSort = "default";
let editingTaskId = null;


let recurringSkips = {};

try {
    const parsed = JSON.parse(localStorage.getItem("recurringSkips"));

    if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
    ) {
        recurringSkips = parsed;
    }
} catch (error) {
    console.error("Could not load recurring skips:", error);
    recurringSkips = {};
}
// Ensure each recurring series has an array of skipped dates.
for (const key of Object.keys(recurringSkips)) {
    if (!Array.isArray(recurringSkips[key])) {
        delete recurringSkips[key];
    }
}

let journalDate = getDateKey();
//If the tab stays open past midnight
let lastToday = getDateKey();

// ============================================================
// DOM REFERENCES & CONSTANTS
// ============================================================

//task
const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");

//repeating tasks
const repeatDaily = document.getElementById("repeatDaily");

//filters
const taskPriority = document.getElementById("taskPriority");
const priorityFilter = document.getElementById("priorityFilter");
const sortTasks = document.getElementById("sortTasks");

//search
const searchTasks = document.getElementById("searchTasks");

//journal
const journal = document.getElementById("journal");
const journalDateInput = document.getElementById("journalDate");
const prevDay = document.getElementById("prevDay");
const nextDay = document.getElementById("nextDay");
const todayBtn = document.getElementById("todayBtn");

// task info
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const emptyMessage = document.getElementById("emptyMessage");

//filter
const filterButtons = document.querySelectorAll(".filter-btn");
const emptyTexts = {
    all: "No tasks yet. Add one below.",
    pending: "No pending tasks.",
    completed: "No completed tasks."
};

//delete
const deleteDialog = document.getElementById("deleteDialog");
const deleteDialogText = document.getElementById("deleteDialogText");

//Reminder and deadline

const taskDeadline = document.getElementById("taskDeadline");
const setDeadlineButton = document.getElementById("setDeadlineButton");
const deadlineDialog = document.getElementById("deadlineDialog");
const saveDeadlineButton = document.getElementById("saveDeadlineButton");
const cancelDeadlineButton = document.getElementById("cancelDeadlineButton");
const clearDeadlineButton = document.getElementById("clearDeadlineButton");
const enableReminder = document.getElementById("enableReminders");
const reminderStatus = document.getElementById("reminderStatus");
let selectedDeadline = "";

//BackUp
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

// ============================================================
// HELPERS
// ============================================================


function makeId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDeadline(dueAt){
    if(!dueAt) return "";

    const date = new Date(dueAt);
    return date.toLocaleString([], {dateStyle: "medium", timeStyle: "short"});
}

function getDeadlineStatus(task){
    if(!task.dueAt) return "";

    const due = new Date(task.dueAt);
    const now = new Date();

    if (Number.isNaN(due.getTime())) return "Invalid deadline";
    if (task.completed) return "Completed";
    if (due < now) return "Overdue";

    if (getDateKey(due) === getDateKey(now)) {
        return "Due today";
    }

    return "Upcoming";
}

function getPriorityRank(priority) {
    const priorityRanks = {
        high: 3,
        medium: 2,
        low: 1
    };
    return priorityRanks[priority] ?? 0;
}
function syncTemplate(task) {
    if (!task.recurrenceId) return;
    const template = recurringTemplates.find(t => t.recurrenceId === task.recurrenceId);
    if (!template) return;
    template.text = task.text;
    template.priority = task.priority;
    template.dueAt = task.dueAt ?? null;
    saveRecurringTemplates();
}

// STORAGE

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.error("Could not save " + key, err);
    }
}

function saveTasks() {
    saveToStorage("tasks", tasks);
}

function saveRecurringTemplates() {
    saveToStorage("recurringTemplates", recurringTemplates);
}

function saveRecurringSkips() {
    saveToStorage("recurringSkips", recurringSkips);
}

//BackUp
function exportData(){
    //gathering
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks: tasks,
        recurringTemplates: recurringTemplates,
        recurringSkips: recurringSkips,
        journal: {}
    };

    //journal entries one per date
    for (let i=0; i< localStorage.length; i++){
        const key  = localStorage.key(i);
        if(key && key.startsWith("journal:")){
            data.journal[key]=localStorage.getItem(key);
        }
    }

    //turn into text
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], {type: "application/json"});

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "planner-backup-" + getDateKey() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function importData(file){
    const reader = new FileReader();

    reader.onload = function(){
        try{
            const data = JSON.parse(reader.result);

            if(!Array.isArray(data.tasks) || !Array.isArray(data.recurringTemplates)){
                throw new Error("This doesn't look like a planner backup.");
            }
            if(!confirm("This Will replace all current data. Continue?")) return;

            saveToStorage("tasks", data.tasks);
            saveToStorage("recurringTemplates", data.recurringTemplates);
            saveToStorage("recurringSkips", data.recurringSkips || {});

            Object.keys(localStorage)
                .filter(key => key.startsWith("journal:"))
                .forEach(key => localStorage.removeItem(key));

            Object.entries(data.journal || {}).forEach(function([key, value]){
                if(key.startsWith("journal:") && typeof value === "string"){
                    localStorage.setItem(key, value);
                }
            });
            location.reload();
        }catch(err){
            alert("Import failed " + err.message);
        }
    };
    reader.readAsText(file);
}

// TASK LOGIC

function endEditing() {
    editingTaskId = null;
    document.querySelectorAll(".edit-button").forEach(function (button) {
        button.disabled = false;
    });
}

function askDeleteChoice(task) {
    return new Promise(function (resolve) {
        if (deleteDialog.open) {
            resolve("cancel");
            return;
        }

        deleteDialogText.textContent = `"${task.text}" repeats every day. What do you want to delete?`;
        deleteDialog.returnValue = "";

        deleteDialog.addEventListener(
            "close",
            function () {
                resolve(deleteDialog.returnValue || "cancel");
            },
            { once: true }
        );

        deleteDialog.showModal();
    });
}

//delete task
async function deleteTask(task) {
    if (!task.repeatDaily || !task.recurrenceId) {
        tasks = tasks.filter(item => item.id !== task.id);
        return true;
    }

    const choice = await askDeleteChoice(task);

    if (choice === "today") {
        const today = task.occurrenceDate || getDateKey();
        recurringSkips[task.recurrenceId] ??= [];
        if (!recurringSkips[task.recurrenceId].includes(today)) {
            recurringSkips[task.recurrenceId].push(today);
        }
        tasks = tasks.filter(item => item.id !== task.id);
        saveRecurringSkips();
        return true;
    }

    if (choice === "series") {
        tasks = tasks.filter(item => item.recurrenceId !== task.recurrenceId);
        recurringTemplates = recurringTemplates.filter(
            template => template.recurrenceId !== task.recurrenceId
        );
        delete recurringSkips[task.recurrenceId];
        saveRecurringTemplates();
        saveRecurringSkips();
        return true;
    }

    return false;
}

function createDailyOccurrences() {
    const today = getDateKey();

    recurringTemplates.forEach(function (template) {
        const recurrenceId = template.recurrenceId;

        if (recurringSkips[recurrenceId]?.includes(today)) {
            return;
        }

        const alreadyExists = tasks.some(function (task) {
            return task.recurrenceId === recurrenceId && task.occurrenceDate === today;
        });

        if (alreadyExists) {
            return;
        }

        tasks.push({
            id: makeId(),
            text: template.text,
            completed: false,
            priority: template.priority,
            repeatDaily: true,
            recurrenceId: recurrenceId,
            occurrenceDate: today,
            dueAt: template.dueAt ?? null,
            reminderSent: false
        });
    });

    tasks = tasks.filter(function (task) {
        return !(task.repeatDaily && task.recurrenceId && task.occurrenceDate < today);
    });

    saveTasks();
}

//updating stats
function updateStats() {
    let total = tasks.length;
    let completed = tasks.filter(item => item.completed).length;
    let pending = tasks.filter(item => !item.completed).length;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;
    searchTasks.hidden = tasks.length === 0;
    if (tasks.length === 0) searchTasks.value = ""; 
}


// RENDERING, FILTERING & SORTING


function renderTask(task) {
    const taskItem = document.createElement("div");
    taskItem.dataset.id = task.id;

    const taskText = document.createElement("span");
    taskText.textContent = task.text;

    //deadline
    const deadlineLabel = document.createElement("span");
    deadlineLabel.classList.add("deadline-label");

    function updateDeadlineLabel() {
        if (!task.dueAt) {
            deadlineLabel.textContent = "";
            deadlineLabel.hidden = true;
            return;
        }

        const status = getDeadlineStatus(task);

        deadlineLabel.textContent =
            `${formatDeadline(task.dueAt)} · ${status}`;

        deadlineLabel.classList.toggle(
            "overdue",
            status === "Overdue"
        );

        deadlineLabel.hidden = false;
    }

    updateDeadlineLabel();


    //priotity
    const prioritySelect = document.createElement("select");
    prioritySelect.classList.add("priority");
    const priorities = ["low", "medium", "high"];

    priorities.forEach(function (priority) {
        const option = document.createElement("option");
        option.value = priority;
        option.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
        prioritySelect.appendChild(option);
    });
    prioritySelect.value = task.priority ?? "medium";
    prioritySelect.classList.add(prioritySelect.value);

    prioritySelect.addEventListener("change", function () {
        task.priority = prioritySelect.value;
        prioritySelect.classList.remove("low", "medium", "high");
        prioritySelect.classList.add(task.priority);

        saveTasks();
        syncTemplate(task);
        applyFilter();
    });

    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.checked = task.completed;
    checkBox.setAttribute("aria-label", "Mark complete: " + task.text);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");
    deleteButton.setAttribute("aria-label", "Delete " + task.text);

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add("edit-button");
    editButton.setAttribute("aria-label", "Edit " + task.text);
    editButton.disabled = editingTaskId !== null;

    //checkbok
    checkBox.addEventListener("change", function () {
        if (checkBox.checked) {
            task.completed = true;
            taskText.classList.add("completed");
        } else {
            taskText.classList.remove("completed");
            task.completed = false;
        }
        saveTasks();
        updateStats();
        applyFilter();
    });
    if (task.completed) {
        taskText.classList.add("completed");
    }

    //delete

    deleteButton.addEventListener("click", async function () {
        const deleted = await deleteTask(task);

        if (!deleted) return;

        if (editingTaskId === task.id) {
            endEditing();
        }

        // Rebuild the displayed task list from the updated tasks array.
        output.replaceChildren();
        tasks.forEach(renderTask);

        saveTasks();
        updateStats();
        applyFilter();
    });


    //edit
    editButton.addEventListener("click", function () {
        if (editingTaskId !== null) {
            return;
        }

        editingTaskId = task.id;
        document.querySelectorAll(".edit-button").forEach(function (button) {
            button.disabled = true;
        });

        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.value = task.text;
        editInput.classList.add("edit-input");

        editInput.addEventListener("input", function () {
            editInput.setCustomValidity("");
        });

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.classList.add("save-edit-button");

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.classList.add("cancel-edit-button");

        // Hide the current task text and Edit button
        taskText.hidden = true;
        editButton.hidden = true;

        taskItem.insertBefore(editInput, deleteButton);
        taskItem.insertBefore(saveButton, deleteButton);
        taskItem.insertBefore(cancelButton, deleteButton);

        editInput.focus();

        saveButton.addEventListener("click", function () {
            const newText = editInput.value.trim();

            if (newText === "") {
                editInput.setCustomValidity("Task name can't be empty.");
                editInput.reportValidity();
                editInput.focus();
                return;
            }

            task.text = newText;
            taskText.textContent = newText;

            checkBox.setAttribute("aria-label", "Mark complete: " + newText);
            deleteButton.setAttribute("aria-label", "Delete " + newText);
            editButton.setAttribute("aria-label", "Edit " + newText);

            saveTasks();
            syncTemplate(task);

            taskText.hidden = false;
            editButton.hidden = false;

            editInput.remove();
            saveButton.remove();
            cancelButton.remove();

            endEditing();
            applyFilter();
        });

        cancelButton.addEventListener("click", function () {
            taskText.hidden = false;
            editButton.hidden = false;

            editInput.remove();
            saveButton.remove();
            cancelButton.remove();

            endEditing();
        });

        editInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") saveButton.click();
            else if (e.key === "Escape") cancelButton.click();
        });
    });

    taskItem.appendChild(checkBox);
    taskItem.appendChild(taskText);
    taskItem.appendChild(deadlineLabel);
    taskItem.appendChild(prioritySelect);
    taskItem.appendChild(editButton);
    taskItem.appendChild(deleteButton);

    output.append(taskItem);
}

//apply filters + sorting
function applyFilter() {
    const searchText = searchTasks.value.trim().toLowerCase();
    let visibleCount = 0;

    for (const taskItem of output.children) {
        const isCompleted = taskItem.querySelector('input[type="checkbox"]').checked;
        const taskPriorityValue = taskItem.querySelector("select.priority").value;
        const taskText = taskItem.querySelector("span").textContent.toLowerCase();

        const matchesSearch = taskText.includes(searchText);

        const matchesStatus =
            currentFilter === "all" ||
            (currentFilter === "pending" && !isCompleted) ||
            (currentFilter === "completed" && isCompleted);

        const matchesPriority =
            currentPriorityFilter === "all" || taskPriorityValue === currentPriorityFilter;

        const show = matchesStatus && matchesPriority && matchesSearch;

        taskItem.hidden = !show;
        if (show) visibleCount++;
    }

    // Sorting always starts from the order tasks were created in, then applies priority on top.
    const order = new Map(tasks.map((task, index) => [task.id, index]));
    const currentItems = Array.from(output.children);
    const sortedItems = currentItems.slice().sort(function (a, b) {
        const orderDiff = order.get(a.dataset.id) - order.get(b.dataset.id);
        if (currentSort === "default") return orderDiff;

        const rankA = getPriorityRank(a.querySelector("select.priority").value);
        const rankB = getPriorityRank(b.querySelector("select.priority").value);
        const rankDiff = currentSort === "priority-desc" ? rankB - rankA : rankA - rankB;

        return rankDiff || orderDiff;
    });

    // Only touch the DOM if the order actually changed
    if (sortedItems.some((item, i) => item !== currentItems[i])) {
        sortedItems.forEach(function (item) {
            output.appendChild(item);
        });
    }

    if (visibleCount === 0) {
        if (searchText !== "") {
            emptyMessage.textContent = `No tasks match "${searchTasks.value.trim()}".`;
        } else if (currentFilter !== "all" && currentPriorityFilter !== "all") {
            emptyMessage.textContent = `No ${currentPriorityFilter}-priority ${currentFilter} tasks.`;
        } else if (currentPriorityFilter !== "all") {
            emptyMessage.textContent = `No ${currentPriorityFilter}-priority tasks.`;
        } else {
            emptyMessage.textContent = emptyTexts[currentFilter];
        }
    }
    emptyMessage.hidden = visibleCount > 0;
}

// JOURNAL

function loadJournal() {
    journalDateInput.value = journalDate;
    try {
        journal.value = localStorage.getItem("journal:" + journalDate) || "";
    } catch (error) {
        console.error("Could not load journal entry:", error);
        journal.value = "";
    }
    journal.setAttribute(
        "aria-label",
        journalDate === getDateKey() ? "Today's journal" : "Journal for " + journalDate
    );
}

function shiftDay(days) {
    const d = new Date(journalDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    journalDate = getDateKey(d);
    loadJournal();
}

function checkNewDay() {
    const today = getDateKey();
    if (today === lastToday) return;

    if (journalDate === lastToday) {
        journalDate = today;
        loadJournal();
    }
    lastToday = today;
    endEditing();
    createDailyOccurrences();
    output.replaceChildren();
    tasks.forEach(renderTask);
    updateStats();
    applyFilter();
}


// EVENT LISTENERS

    // --- tasks ---
function updateDeadlineButton() {
    setDeadlineButton.textContent = selectedDeadline
        ? `Deadline: ${new Date(selectedDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
        : "Set deadline";
}

setDeadlineButton.addEventListener("click", function () {
    taskDeadline.value = selectedDeadline;
    deadlineDialog.showModal();
});

saveDeadlineButton.addEventListener("click", function () {
    selectedDeadline = taskDeadline.value;
    updateDeadlineButton();
    deadlineDialog.close();
});

cancelDeadlineButton.addEventListener("click", function () {
    deadlineDialog.close();
});

clearDeadlineButton.addEventListener("click", function () {
    selectedDeadline = "";
    taskDeadline.value = "";
    updateDeadlineButton();
    deadlineDialog.close();
});

deleteDialog.addEventListener("click", function (e) {
    if (e.target === deleteDialog) deleteDialog.close("cancel");
});

//backUp
exportBtn.addEventListener("click", exportData);

importBtn.addEventListener("click", function(){
    importFile.click();
});

importFile.addEventListener("click", function(){
    importFile.value="";
});

importFile.addEventListener("change", function(){
    const file = importFile.files && importFile.files[0];
    if (file) importData(file);
});


//add tasks button
addTask.addEventListener("click", function () {
    if (taskInput.value.trim() === "") {
        return;
    }
    const isRepeating = repeatDaily.checked;

    const task = {
        id: makeId(),
        text: taskInput.value.trim(),
        completed: false,
        priority: taskPriority.value,

        repeatDaily: isRepeating,
        recurrenceId: isRepeating ? makeId() : null,
        occurrenceDate: isRepeating ? getDateKey() : null,
        dueAt: selectedDeadline ? new Date(selectedDeadline).toISOString() : null,
        reminderSent: false
    };
    tasks.push(task);
    saveTasks();

    if (isRepeating) {
        recurringTemplates.push({
            recurrenceId: task.recurrenceId,
            text: task.text,
            priority: task.priority,
            dueAt: task.dueAt,
            repeatDaily: true
        });

        saveRecurringTemplates();
    }

    renderTask(task);
    updateStats();
    applyFilter();

    taskInput.value = "";
    repeatDaily.checked = false;
    selectedDeadline = "";
    updateDeadlineButton();
    taskInput.focus();
});

taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTask.click();
});

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");
        applyFilter();
    });
});

sortTasks.addEventListener("change", function () {
    currentSort = sortTasks.value;
    applyFilter();
});

priorityFilter.addEventListener("change", function () {
    currentPriorityFilter = priorityFilter.value;
    applyFilter();
});

searchTasks.addEventListener("input", function () {
    applyFilter();
});


enableReminder.addEventListener("click", async function () {
    if (!("Notification" in window)) {
        reminderStatus.textContent =
            "This browser does not support notifications.";
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            reminderStatus.textContent =
                "Browser reminders enabled.";
            checkDueReminders();
        } else {
            reminderStatus.textContent =
                "Notification permission was not granted.";
        }
    } catch (error) {
        console.error("Could not enable notifications:", error);
        reminderStatus.textContent =
            "Could not enable notifications.";
    }
});

function checkDueReminders() {
    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const now = Date.now();
    let changed = false;

    tasks.forEach(function (task) {
        if (!task.dueAt || task.completed || task.reminderSent) {
            return;
        }

        const dueTime = new Date(task.dueAt).getTime();

        if (!Number.isFinite(dueTime) || dueTime > now) {
            return;
        }

        try {
            new Notification("Task deadline reached", {
                body: task.text
            });

            task.reminderSent = true;
            changed = true;
        } catch (error) {
            console.error("Could not show reminder:", error);
        }
    });

    if (changed) {
        saveTasks();
    }
}

// --- journal ---
journal.addEventListener("input", function () {
    const key = "journal:" + journalDate;
    try{
        if (journal.value.trim() === "") {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, journal.value);
        }
    }
    catch(error){
        console.error("Could not save journal entry:", error);
    }

});

prevDay.addEventListener("click", function () {
    shiftDay(-1);
});

nextDay.addEventListener("click", function () {
    shiftDay(1);
});

todayBtn.addEventListener("click", function () {
    journalDate = getDateKey();
    loadJournal();
});

journalDateInput.addEventListener("change", function () {
    if (journalDateInput.value) {
        journalDate = journalDateInput.value;
        loadJournal();
    } else {
        journalDate = getDateKey();
        loadJournal();
    }
});

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) checkNewDay();
});

window.addEventListener("focus", checkNewDay);

window.addEventListener("storage", function (e) {
    if (["tasks", "recurringTemplates", "recurringSkips"].includes(e.key)) {
        location.reload();
    }
});

// STARTUP

createDailyOccurrences();
tasks.forEach(renderTask);
saveTasks();

updateStats();

applyFilter();

// one-time move of your old single entry into today's entry
try {
    const oldJournal = localStorage.getItem("journal");
    if (oldJournal && !localStorage.getItem("journal:" + journalDate)) {
        localStorage.setItem("journal:" + journalDate, oldJournal);
        localStorage.removeItem("journal");
    }
} catch (error) {
    console.error("Could not migrate the old journal entry:", error);
}

loadJournal();
checkDueReminders();
setInterval(checkNewDay, 60000);
