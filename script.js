console.log("Planner loaded");

const savedTasks=localStorage.getItem("tasks");
let tasks=savedTasks ? JSON.parse(savedTasks):[];

const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");
const taskPriority=document.getElementById("taskPriority");

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
    
function renderTask(task){
    const taskItem = document.createElement("div");

    const taskText = document.createElement("span");
    taskText.textContent=task.text;

    const priorityText = document.createElement("span");
    priorityText.textContent = task.priority ?? "medium";
    priorityText.classList.add(
        "priority", task.priority ?? "medium"
    );

    const checkBox = document.createElement("input");
    checkBox.type="checkbox";
    checkBox.checked = task.completed;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    const editButton = document.createElement("button");
    editButton.textContent= "Edit";

    

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
    });
    if(task.completed){
        taskText.classList.add("completed");
    }

    deleteButton.addEventListener("click", function(){
        tasks = tasks.filter(function(item){
            return item.id!==task.id;
        });
        taskItem.remove();
        saveTasks();
        
    });

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
    taskItem.appendChild(priorityText);
    taskItem.appendChild(editButton);
    taskItem.appendChild(deleteButton);


    output.append(taskItem);
}
tasks.forEach(function(task) {
    renderTask(task);
});

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
    taskInput.value = "";

});


