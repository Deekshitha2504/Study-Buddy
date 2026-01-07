let timer = null;
let defaultTime = 1500;
let timeLeft = defaultTime;

const display = document.getElementById('display');
const buddy = document.getElementById('buddy-sprite');
const buddyStatus = document.getElementById('buddy-status');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');


function updateDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerdisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function sTimer() {
  if (timer !== null) return;
  buddy.src = "c1.gif"; 
  buddyStatus.innerText = "We're focusing now...";

  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } 
    else {
      stopTimerLogic();
      buddy.src = "2c.gif";
      buddyStatus.innerText = "Great job! Take a break.";
      alert("Session Complete!");
    }
  }, 1000);
}

function pTimer() {
  stopTimerLogic();
  buddy.src = "3c.gif";
  buddyStatus.innerText = "Paused. Ready to continue?";
}

function reTimer() {
  stopTimerLogic();
  timeLeft = defaultTime; 
  updateDisplay();
  buddy.src = "3c.gif";
  buddyStatus.innerText = "Ready to start a new session?";
}

function stopTimerLogic() {
  clearInterval(timer);
  timer = null;
}


function addTask() {
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    alert("Please enter a task!");
    return;
  }
  
  const li = document.createElement('li');
  li.innerHTML = `
    <span>${taskText}</span>
    <button class="delbtn" onclick="delTask(this)">Done</button>
  `;

  taskList.appendChild(li);
  taskInput.value = "";
}


function delTask(buttonElement) {
  buttonElement.parentElement.remove();
}

updateDisplay();

window.onload = async () => {
    const response = await fetch('/tasks');
    const tasks = await response.json();
    tasks.forEach(t => renderTask(t.task, t.id));
    updateDisplay();
};

async function addTask() {
    const input = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const response = await fetch('/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'}, 

        body: JSON.stringify({ task: taskText }) 
    });
     const newTask = await response.json();
    
     renderTask(newTask.task, newTask.id);
     input.value = "";
}


function renderTask(text, id) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${text}</span>
        <button class="delbtn" onclick="delTask(${id}, this)">[X]</button>
    `;
    document.getElementById('taskList').appendChild(li);
}

async function delTask(id, buttonElement) {
    console.log(`Attempting to delete task ID: ${id}`);
    
    try {
        const response = await fetch(`/tasks/${id}`, { 
            method: 'DELETE' 
        });

        if (response.ok) {
            const taskItem = buttonElement.parentElement;
            taskItem.remove();
            console.log("Task removed from UI and Database.");

            
            const xpResponse = await fetch('/complete-task', { method: 'POST' });
            const stats = await xpResponse.json();
            
          
            document.getElementById('buddy-status').innerText = `> LVL: ${stats.level} | XP: ${stats.xp}/100`;
        } else {
            console.error("Server refused to delete the task.");
        }
    } catch (err) {
        console.error("Network error during deletion:", err);
    }
}

async function delTask(id, element) {
    await fetch(`/tasks/${id}`, { method: 'DELETE' });
    element.parentElement.remove();
}
