import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isActive, setIsActive] = useState(false);
  const [buddyInfo, setBuddyInfo] = useState({ 
    img: "3c.gif", 
    status: "Ready to start a session?",
    lvl: 1, 
    xp: 0 
  });

  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setBuddyInfo(prev => ({ ...prev, img: "2c.gif", status: "Great job!" }));
      alert("Session Complete!");
      setIsActive(false);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:5000/tasks');
      if (!res.ok) throw new Error('Server unreachable');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
    console.error("Backend Error:", err.message);
   }
 };

  useEffect(() => { fetchTasks(); }, []); 

  const handleAddTask = async () => {
    if (!taskInput) return;
    const res = await fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: taskInput })
    });
    const newTask = await res.json();
    setTasks([...tasks, newTask]);
    setTaskInput("");
  };

  const handleReset = () => {
  setIsActive(false); 
  setTimeLeft(1500);  
 };

  const handleDelTask = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, { method: 'DELETE' });
    setTasks(tasks.filter(t => t.id !== id));
    
  
    const xpRes = await fetch('http://localhost:5000/complete-task', { method: 'POST' });
    const stats = await xpRes.json();
    setBuddyInfo(prev => ({ ...prev, lvl: stats.level, xp: stats.xp }));
  };

  return (
  <div className="arcade-window">
    
    <marquee id="scrolltxt" behavior="scroll" direction="left"> 
        ~~~~~~ *:･ﾟ✧\(◕ヮ◕\) Make it a Productive Day! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ ~~~~~~ 
    </marquee> 

    
    <div className="panel-container">
      <section className="panel">
        <h2>TIMER</h2>
        <h1>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</h1>
        <button onClick={() => setIsActive(true)}>START</button>
        <button onClick={() => setIsActive(false)}>PAUSE</button>
        <button onClick={handleReset}>RESET</button>
      </section>

      <section className="panel">
        <h2>YOUR_COMPANION</h2>
        <img src={buddyInfo.img} alt="buddy" />
        <p>{buddyInfo.status}</p>
        <p>LVL: {buddyInfo.lvl} | XP: {buddyInfo.xp}/100</p>
      </section>

      <section className="panel">
        <h2>ACTIVE_TASKS</h2>
        <input 
          value={taskInput} 
          onChange={(e) => setTaskInput(e.target.value)} 
          placeholder="New Task..." 
        />
        <button onClick={handleAddTask}>[+]</button>
        <ul>
          {tasks.map(t => (
            <li key={t.id}>
              {t.task} <button onClick={() => handleDelTask(t.id)}>[X]</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
    <footer id="footer">
        <p> &copy; stay productive!(❁´◡`❁) </p>
    </footer>  
  </div>
);
}

export default App;