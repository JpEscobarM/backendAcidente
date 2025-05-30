const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();


const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
const corsOptions = {
  origin: "*", // Apenas este domínio pode acessar o backend
  methods: "GET,POST", // Permite apenas requisições GET e POST
  allowedHeaders: "Content-Type", // Permite apenas cabeçalhos com "Content-Type"
};

app.use(cors(corsOptions));

app.use(express.json());

// Conectar ao banco SQLite
const db = new sqlite3.Database("./accidents.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Conectado ao banco SQLite.");
    db.run("CREATE TABLE IF NOT EXISTS accidents (id INTEGER PRIMARY KEY, date TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS record (id INTEGER PRIMARY KEY, record INT)");
    db.run("INSERT OR REPLACE INTO record (id, record) VALUES (1, 40)");
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

app.get("/record", (req, res) => {
  db.get("SELECT record FROM record WHERE id = 1", [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({recordDays: row ? row.record : 40});
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
      return res.status(500).json({ error: err.message });
    }

    // Após inserir, recalcular recorde
    db.all("SELECT date FROM accidents ORDER BY date ASC", [], (err, rows) => {
      if (err || rows.length < 2) {
        return res.json({ message: "Data salva. Sem dados suficientes para recorde.", date });
      }

      let maxDiff = 0;
      for (let i = 1; i < rows.length; i++) {
        const d1 = new Date(rows[i - 1].date);
        const d2 = new Date(rows[i].date);
        const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
        if (diff > maxDiff) maxDiff = diff;
      }

      db.get("SELECT record FROM record WHERE id = 1", [], (err, row) => {
        const currentRecord = row ? row.record : 0;
        if (maxDiff > currentRecord) {
          db.run("INSERT OR REPLACE INTO record (id, record) VALUES (1, ?)", [maxDiff]);
        }
      });

      res.json({ message: "Data atualizada com sucesso!", date });
    });
  });
});

app.post("/reset", (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM accidents");
    db.run("DELETE FROM record");
    res.json({ message: "Base de dados limpa com sucesso." });
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});