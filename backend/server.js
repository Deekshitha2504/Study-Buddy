const express = require('express');
const cors = require('cors'); // Imports the tool
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./database.sqlite');

app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serves your HTML/CSS/JS files
app.use(cors());              // Activates the tool

// Initialize SQL Tables
// Update initialization to include stats
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT)");
    db.run(`CREATE TABLE IF NOT EXISTS task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run("CREATE TABLE IF NOT EXISTS timer_state (id INTEGER PRIMARY KEY, time_left INTEGER)");
    // New table for Buddy Stats
    db.run("CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY, level INTEGER, xp INTEGER)");

    // Set initial stats if they don't exist
    db.run("INSERT OR IGNORE INTO stats (id, level, xp) VALUES (1, 1, 0)");
});

// --- API ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sb1.html'));
});

// Get all tasks
app.get('/tasks', (req, res) => {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
        res.json(rows);
    });
});

// Add a task
app.post('/tasks', (req, res) => {
    const { task } = req.body;
    db.run("INSERT INTO tasks (task) VALUES (?)", [task], function (err) {
        res.json({ id: this.lastID, task });
    });
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    // 1. First, find the name of the task we are about to delete
    db.get("SELECT task FROM tasks WHERE id = ?", [taskId], (err, row) => {
        if (row) {
            // 2. Save it to our History table for the Heatmap!
            db.run("INSERT INTO task_history (task_name) VALUES (?)", [row.task]);

            // 3. NOW delete it from the active list
            db.run("DELETE FROM tasks WHERE id = ?", [taskId], (err) => {
                res.json({ message: "Task archived for Data Science!" });
            });
        }
    });
});

// Route to get current stats
app.get('/stats', (req, res) => {
    db.get("SELECT level, xp FROM stats WHERE id = 1", (err, row) => {
        res.json(row || { level: 1, xp: 0 });
    });
});

// Route to handle XP gain
app.post('/complete-task', (req, res) => {
    db.get("SELECT level, xp FROM stats WHERE id = 1", (err, row) => {
        let { level, xp } = row;
        xp += 20; // Gain 20 XP per task

        if (xp >= 100) {
            level += 1;
            xp = 0; // Reset XP on level up
        }

        db.run("UPDATE stats SET level = ?, xp = ? WHERE id = 1", [level, xp], () => {
            res.json({ level, xp });
        });
    });
});

// Get timer state
app.get('/timer-state', (req, res) => {
    db.get("SELECT time_left FROM timer_state WHERE id = 1", (err, row) => {
        res.json(row || { time_left: 1500 });
    });
});

// Update timer state
app.post('/timer-state', (req, res) => {
    const { time_left } = req.body;
    db.run("INSERT OR REPLACE INTO timer_state (id, time_left) VALUES (1, ?)", [time_left], () => {
        res.sendStatus(200);
    });
});

// Start server
// Dynamic Port for Deployment
const PORT = process.env.PORT || 5000;

// Persistent Database Path for Railway
const path = require('path');
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'database.db')
    : path.join(__dirname, 'database.db');

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
