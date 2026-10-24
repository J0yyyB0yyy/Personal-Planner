
function makeId(){
    return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}

let tasks = [];
try{
    const parsed = JSON.parse(localStorage.getItem("tasks"));
    tasks = Array.isArray(parsed) ? parsed : []; 
}catch{
    tasks = [];
}

tasks.forEach(function(t) {t.id ??= makeId();});

let currentFilter = "all"
let currentPriorityFilter = "all";
let currentSort = "default";

let editingTaskId = null;

//task
const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");

//repeating tasks
const repeatDaily = document.getElementById("repeatDaily");

//filters
const taskPriority=document.getElementById("taskPriority");
const priorityFilter = document.getElementById("priorityFilter");
const sortTasks = document.getElementById("sortTasks");

//search
const searchTasks = document.getElementById("searchTasks");

//journal
const journal = document.getElementById("journal");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const emptyMessage = document.getElementById("emptyMessage");

const filterButtons=document.querySelectorAll(".filter-btn");
const emptyTexts = {
    all: "No tasks yet. Add one below.",
    pending: "No pending tasks.",
    completed: "No completed tasks."
};

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

let recurringSkips = {};
try {
    recurringSkips = JSON.parse(
        localStorage.getItem("recurringSkips")
    ) || {};
} catch {
    recurringSkips = {};
}

function saveRecurringSkips() {
    localStorage.setItem(
        "recurringSkips",
        JSON.stringify(recurringSkips)
    );
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
saveTasks();

function endEditing() {
    editingTaskId = null;
    document.querySelectorAll(".edit-button").forEach(function (button) {
        button.disabled = false;
    });
}

//delete task

function deleteTask(task) {
    // Delete an ordinary task.
    if (!task.repeatDaily || !task.recurrenceId) {
        tasks = tasks.filter(item => item.id !== task.id);
        return true;
    }

    const choice = prompt(
        "Delete recurring task:\n" +
        "1. Delete today only\n" +
        "2. Delete the entire series\n\n" +
        "Enter 1 or 2. Cancel to keep the task."
    );

    if (choice !== "1" && choice !== "2") {
        return false;
    }

    if (choice === "1") {
        const today = getDateKey();

        recurringSkips[task.recurrenceId] ??= [];

        if (!recurringSkips[task.recurrenceId].includes(today)) {
            recurringSkips[task.recurrenceId].push(today);
        }

        saveRecurringSkips();

        tasks = tasks.filter(item => item.id !== task.id);
        return true;
    }

    // Delete the entire recurring series.
    tasks = tasks.filter(
        item => item.recurrenceId !== task.recurrenceId
    );

    delete recurringSkips[task.recurrenceId];
    saveRecurringSkips();

    return true;
}


function renderTask(task){
    const taskItem = document.createElement("div");
    taskItem.dataset.id = task.id;

    const taskText = document.createElement("span");
    taskText.textContent=task.text;

    //priotity
    const prioritySelect = document.createElement("select");
    prioritySelect.classList.add("priority");
    const priorities = ["low", "medium", "high"];

    priorities.forEach(function(priority){
        const option = document.createElement("option");
        option.value=priority;
        option.textContent=priority.charAt(0).toUpperCase()+priority.slice(1);
        prioritySelect.appendChild(option);
    });
    prioritySelect.value=task.priority ?? "medium";
    prioritySelect.classList.add(prioritySelect.value);

    prioritySelect.addEventListener("change", function(){

        task.priority = prioritySelect.value;
        prioritySelect.classList.remove("low", "medium", "high");
        prioritySelect.classList.add(task.priority);

        saveTasks();
        applyFilter();
    })

    const checkBox = document.createElement("input");
    checkBox.type="checkbox";
    checkBox.checked = task.completed;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");

    const editButton = document.createElement("button");
    editButton.textContent= "Edit";
    editButton.classList.add("edit-button");

    
    //checkbok
    checkBox.addEventListener("change", function(){
        if(checkBox.checked){
            task.completed=true;
            taskText.classList.add("completed");
        }
        else{
            taskText.classList.remove("completed");
            task.completed=false;
        }
        saveTasks();
        updateStats();
        applyFilter();
    });
    if(task.completed){
        taskText.classList.add("completed");
    }

    //delete
    deleteButton.addEventListener("click", function () {
        const deleted = deleteTask(task);

        if (!deleted) return;

        taskItem.remove();
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

            saveTasks();

            taskText.hidden = false;
            editButton.hidden = false;

            editInput.remove();
            saveButton.remove();
            cancelButton.remove();

            endEditing();
        
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
    taskItem.appendChild(prioritySelect);
    taskItem.appendChild(editButton);
    taskItem.appendChild(deleteButton);


    output.append(taskItem);
}

createDailyOccurrences();
tasks.forEach(function(task) {
    renderTask(task);
});

updateStats();
applyFilter();

//add tasks button
addTask.addEventListener("click", function(){

    if(taskInput.value.trim()===""){
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
        occurrenceDate: getDateKey()
    };
    tasks.push(task);
    saveTasks();
    renderTask(task);
    updateStats();
    applyFilter();

    taskInput.value = "";
    repeatDaily.checked = false;
    taskInput.focus();
});
taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTask.click();
});

//updating stats
function updateStats(){

    let total = tasks.length;
    let completed = tasks.filter(item=>item.completed).length;
    let pending = tasks.filter(item=>!item.completed).length;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;

}

function getPriorityRank(priority){
    const priorityRanks={
        high: 3,
        medium: 2,
        low: 1
    };
    return priorityRanks[priority] ?? 0;
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
            currentPriorityFilter === "all" ||
            taskPriorityValue === currentPriorityFilter;

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
            emptyMessage.textContent =
                `No ${currentPriorityFilter}-priority ${currentFilter} tasks.`;
        } else if (currentPriorityFilter !== "all") {
            emptyMessage.textContent =
                `No ${currentPriorityFilter}-priority tasks.`;
        } else {
            emptyMessage.textContent = emptyTexts[currentFilter];
        }
    }
    emptyMessage.hidden = visibleCount > 0;
}

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

function createDailyOccurrences(){
    const today = getDateKey();

    const recurrenceIds = new Set(
        tasks
            .filter(task => task.repeatDaily && task.recurrenceId)
            .map(task => task.recurrenceId)
    );

    recurrenceIds.forEach(function(recurrenceId){
        if (recurringSkips[recurrenceId]?.includes(today)) {
            return;
        }

        const series = tasks.filter(task => task.recurrenceId === recurrenceId);

        const alreadyExists = series.some(task => task.occurrenceDate === today);
        if (alreadyExists) return;

        const latestTask = series.reduce((latest, task) => {
            return task.occurrenceDate > latest.occurrenceDate ? task : latest;
        });
        if (latestTask.occurrenceDate > today) return;

        tasks.push({
            ...latestTask,
            id: makeId(),
            completed: false,
            occurrenceDate: today
        });
    });

    // only show today's version
    tasks = tasks.filter(function (task) {
        return !(task.repeatDaily && task.recurrenceId && task.occurrenceDate < today);
    });

    saveTasks();
}

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

//journal
journal.value = localStorage.getItem("journal") || "";
journal.addEventListener("input", function(){
    localStorage.setItem("journal", journal.value);
});


