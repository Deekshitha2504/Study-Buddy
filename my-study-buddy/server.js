const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors'); 
const app = express();
const db = new sqlite3.Database('./tasks.db');
app.use(cors()); 
app.use(express.json());

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY, lvl INTEGER, xp INTEGER)");
    db.run("INSERT OR IGNORE INTO stats (id, lvl, xp) VALUES (1, 1, 0)");
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sb1.html'));
});

app.get('/tasks', (req, res) => {
    db.all("SELECT * FROM quests", [], (err, rows) => res.json(rows));
});

app.post('/tasks', (req, res) => {
    const { task } = req.body;
    db.run("INSERT INTO quests (task) VALUES (?)", [task], function(err) {
        if (err) return res.status(500).send(err);
        res.json({ id: this.lastID, task });
    });
});

app.delete('/tasks/:id', (req, res) => {
    db.run("DELETE FROM quests WHERE id = ?", req.params.id, () => res.json({ status: "Deleted" }));
});

app.post('/complete-task', (req, res) => {
    db.get("SELECT * FROM stats WHERE id = 1", (err, row) => {
        let newXp = row.xp + 20;
        let newLvl = row.lvl;
        if (newXp >= 100) { newXp = 0; newLvl++; }
        db.run("UPDATE stats SET lvl = ?, xp = ? WHERE id = 1", [newLvl, newXp], () => {
            res.json({ level: newLvl, xp: newXp, leveledUp: newXp === 0 });
        });
    });
});

app.listen(5000, () => console.log('>>> BACKEND ENGINE RUNNING ON PORT 5000'));