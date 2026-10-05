console.log("Planner loaded");

const addTask = document.getElementById("addTasks");
const taskInput=document.getElementById("taskInput");
const output=document.getElementById("output");

addTask.addEventListener("click", function(){
    const taskItem = document.createElement("div");

    const checkBox=document.createElement("input");
    checkBox.type="checkbox";

    const taskText=document.createElement("span");
    if(taskInput.value.trim()===""){
        return;
    }
    taskText.textContent=taskInput.value.trim();

    taskItem.appendChild(checkBox);
    taskItem.appendChild(taskText);
    
    taskInput.value = "";
    output.append(taskItem)

    checkBox.addEventListener("change", function(){
        if(checkBox.checked){
            taskText.classList.add("completed");
        }
        else{
            taskText.classList.remove("completed");
        }
    });

});

