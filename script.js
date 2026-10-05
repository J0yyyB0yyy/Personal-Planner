console.log("Planner loaded");

const tasks=[];

const addTask = document.getElementById("addTasks");
const taskInput = document.getElementById("taskInput");
const output = document.getElementById("output");
    
function renderTask(task){
    const taskItem = document.createElement("div");

    const checkBox = document.createElement("input");
    checkBox.type="checkbox";

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
    });

    taskItem.appendChild(checkBox);
    taskItem.appendChild(taskText);

    output.append(taskItem);
}

addTask.addEventListener("click", function(){

    if(taskInput.value.trim()===""){
        return;
    }
    const task={
        text: taskInput.value.trim(),
        completed: false
    }
    tasks.push(task);
    renderTask(task);
    taskInput.value = "";

});



