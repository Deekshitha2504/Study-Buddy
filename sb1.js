let timer = null;
let timeLeft = 1500;

const timerDisplay = document.getElementById('timerdisplay');
const buddy = document.getElementById('buddy-sprite');
const buddyStatus = document.getElementById('buddy-status');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const xpBar = document.getElementById('xp-bar-fill');

// --- UI HELPER ---
function updateStatsUI(level, xp) {
    buddyStatus.innerText = `LVL: ${level} | XP: ${xp}/100`;
    if(xpBar) xpBar.style.width = `${xp}%`;
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// --- INITIAL LOAD ---
window.onload = async () => {
    // Load Tasks
    const tRes = await fetch('/tasks');
    const tasks = await tRes.json();
    tasks.forEach(t => renderTask(t.task, t.id));

    // Load Timer
    const timeRes = await fetch('/timer-state');
    const state = await timeRes.json();
    timeLeft = state.time_left;
    updateTimerDisplay();

    // Load Stats
    const sRes = await fetch('/stats');
    const stats = await sRes.json();
    updateStatsUI(stats.level, stats.xp);
};

// --- TASK FUNCTIONS ---
async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const response = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: text })
    });
    const newTask = await response.json();
    renderTask(newTask.task, newTask.id);
    taskInput.value = "";
}

function renderTask(text, id) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${text}</span>
        <button class="delbtn" onclick="delTask(${id}, this)">[Done]</button>
    `;
    taskList.appendChild(li);
}

async function delTask(id, buttonElement) {
    // 1. Delete from SQL
    const response = await fetch(`/tasks/${id}`, { method: 'DELETE' });
    if (response.ok) {
        buttonElement.parentElement.remove();
        
        // 2. Add XP
        const xpRes = await fetch('/complete-task', { method: 'POST' });
        const stats = await xpRes.json();
        
        // 3. Update Bar
        updateStatsUI(stats.level, stats.xp);
    }
}

// --- TIMER FUNCTIONS ---
function sTimer() {
    if (timer !== null) return;
    buddy.src = "c1.gif"; 
    timer = setInterval(async () => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft % 10 === 0) syncTimer();
        } else {
            stopTimerLogic();
            alert("Done!");
        }
    }, 1000);
}

function stopTimerLogic() {
    clearInterval(timer);
    timer = null;
}

async function syncTimer() {
    await fetch('/timer-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_left: timeLeft })
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Optional: Press 'F' to go fullscreen
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f') toggleFullscreen();
});