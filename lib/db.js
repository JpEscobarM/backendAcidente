const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./accidents.db", (err) => {
  if (!err) {
    db.run("CREATE TABLE IF NOT EXISTS accidents (id INTEGER PRIMARY KEY, date TEXT UNIQUE)");
    db.run("CREATE TABLE IF NOT EXISTS record (id INTEGER PRIMARY KEY, max_days INTEGER)");
    db.run("INSERT OR IGNORE INTO record (id, max_days) VALUES (1, 40)");
  }
});

module.exports = db;
