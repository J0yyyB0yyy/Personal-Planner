console.log("Planner loaded");

const savedTasks=localStorage.getItem("tasks");
const tasks=savedTasks ? JSON.parse(savedTasks):[];

const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
    
function renderTask(task){
    const taskItem = document.createElement("div");

    const checkBox = document.createElement("input");
    checkBox.type="checkbox";
    checkBox.checked = task.completed;

    const taskText = document.createElement("span");
    taskText.textContent=task.text;

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

    taskItem.appendChild(checkBox);
    taskItem.appendChild(taskText);

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
        text: taskInput.value.trim(),
        completed: false
    }
    tasks.push(task);
    saveTasks();
    renderTask(task);
    taskInput.value = "";

});


