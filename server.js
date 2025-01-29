const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao banco SQLite
const db = new sqlite3.Database("./accidents.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Conectado ao banco SQLite.");
    db.run("CREATE TABLE IF NOT EXISTS accidents (id INTEGER PRIMARY KEY, date TEXT)");
  }
});

// Rota para obter a data do último acidente
app.get("/accident", (req, res) => {
  db.get("SELECT date FROM accidents ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ lastAccident: row ? row.date : null });
    }
  });
});

// Rota para atualizar a data do último acidente
app.post("/accident", (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: "Data inválida" });
  }

  db.run("INSERT INTO accidents (date) VALUES (?)", [date], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Data atualizada com sucesso!", date });
    }
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});