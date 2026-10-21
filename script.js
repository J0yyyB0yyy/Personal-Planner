console.log("Planner loaded");

const savedTasks=localStorage.getItem("tasks");
let tasks=savedTasks ? JSON.parse(savedTasks):[];

const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");
const taskPriority=document.getElementById("taskPriority");
const journal = document.getElementById("journal");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
    
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
    })

    const checkBox = document.createElement("input");
    checkBox.type="checkbox";
    checkBox.checked = task.completed;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    const editButton = document.createElement("button");
    editButton.textContent= "Edit";

    
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
        
    });


    //edit
    editButton.addEventListener("click", function () {
        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.value = task.text;

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
        
        });

        cancelButton.addEventListener("click", function () {
            taskText.hidden = false;
            editButton.hidden = false;

            editInput.remove();
            saveButton.remove();
            cancelButton.remove();
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

//add tasks button
addTask.addEventListener("click", function(){

    if(taskInput.value.trim()===""){
        return;
    }
    const task={
        id: crypto.randomUUID(),
        text: taskInput.value.trim(),
        completed: false,
        priority: taskPriority.value
    };
    tasks.push(task);
    saveTasks();
    renderTask(task);
    updateStats();
    taskInput.value = "";

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

//journal
journal.value = localStorage.getItem("journal") || "";
journal.addEventListener("input", function(){
    localStorage.setItem("journal", journal.value);
});




