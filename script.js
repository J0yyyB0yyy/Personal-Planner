
function makeId(){
    return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
};

let tasks = [];
try{
    const parsed = JSON.parse(localStorage.getItem("tasks"));
    tasks = Array.isArray(parsed) ? parsed : []; 
}catch{
    tasks = [];
}

tasks.forEach(function(t) {t.id ??= makeId();});

let currentFilter = "all";
let currentPriorityFilter = "all";

let editingTaskId = null;


const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");

const taskPriority=document.getElementById("taskPriority");
const priorityFilter = document.getElementById("priorityFilter");

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


function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
saveTasks();
    
function renderTask(task){
    const taskItem = document.createElement("div");

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
    deleteButton.addEventListener("click", function(){
        tasks = tasks.filter(function(item){
            return item.id!==task.id;
        });
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

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";

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

            editingTaskId = null;

            document.querySelectorAll(".edit-button").forEach(function (button) {
                button.disabled = false;
            });
        
        });

        cancelButton.addEventListener("click", function () {
            taskText.hidden = false;
            editButton.hidden = false;

            editInput.remove();
            saveButton.remove();
            cancelButton.remove();

            editingTaskId = null;

            document.querySelectorAll(".edit-button").forEach(function (button) {
                button.disabled = false;
            });
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
    const task={
        id: makeId(),
        text: taskInput.value.trim(),
        completed: false,
        priority: taskPriority.value
    };
    tasks.push(task);
    saveTasks();
    renderTask(task);
    updateStats();
    applyFilter();

    taskInput.value = "";
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

};


function applyFilter() {
    let visibleCount = 0;

    for (const taskItem of output.children) {
        const isCompleted = taskItem.querySelector('input[type="checkbox"]').checked;
        const taskPriorityValue = taskItem.querySelector("select.priority").value;

        const matchesStatus =
            currentFilter === "all" ||
            (currentFilter === "pending" && !isCompleted) ||
            (currentFilter === "completed" && isCompleted);

        const matchesPriority =
            currentPriorityFilter === "all" ||
            taskPriorityValue === currentPriorityFilter;

        const show = matchesStatus && matchesPriority;

        taskItem.hidden = !show;
        if (show) visibleCount++;
    }
    
    if (visibleCount === 0) {
        if (
            currentFilter !== "all" &&
            currentPriorityFilter !== "all"
        ) {
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
priorityFilter.addEventListener("change", function () {
    currentPriorityFilter = priorityFilter.value;
    applyFilter();
});

//journal
journal.value = localStorage.getItem("journal") || "";
journal.addEventListener("input", function(){
    localStorage.setItem("journal", journal.value);
});


