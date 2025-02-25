const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS
const corsOptions = {
  origin: "https://acidente-planetaagua.vercel.app",
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};

app.use(cors(corsOptions));
app.use(express.json());

// Conectar ao banco SQLite
const db = new sqlite3.Database("./accidents.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("✅ Conectado ao banco SQLite.");

    // Criar tabela de acidentes
    db.run("CREATE TABLE IF NOT EXISTS accidents (id INTEGER PRIMARY KEY, date TEXT UNIQUE)");

    // Criar tabela de recorde e inicializar se não existir
    db.run("CREATE TABLE IF NOT EXISTS record (id INTEGER PRIMARY KEY, max_days INTEGER)");
    db.run("INSERT OR IGNORE INTO record (id, max_days) VALUES (1, 40)");
  }
});

// 🔹 Rota para obter a data do último acidente
app.get("/accident", (req, res) => {
  db.get("SELECT date FROM accidents ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ lastAccident: row ? row.date : null });
    }
  });
});

// 🔹 Rota para obter o recorde de dias sem acidente
app.get("/record", (req, res) => {
  db.get("SELECT max_days FROM record WHERE id = 1", [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ record: row ? row.max_days : 0 });
    }
  });
});

// 🔹 Função para atualizar o recorde de dias sem acidentes
function updateRecord(currentDays) {
  db.get("SELECT max_days FROM record WHERE id = 1", [], (err, row) => {
    const maxDays = row ? row.max_days : 0;
    if (currentDays > maxDays) {
      db.run("UPDATE record SET max_days = ? WHERE id = 1", [currentDays], (err) => {
        if (err) console.error("⚠ Erro ao atualizar recorde:", err.message);
      });
    }
  });
}

// 🔹 Rota para atualizar a data do último acidente
app.post("/accident", (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ error: "⚠ Data inválida" });
  }

  db.get("SELECT date FROM accidents ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let lastAccidentDate = row ? new Date(row.date) : null;
    let currentDate = new Date(date);
    let daysWithoutAccident = lastAccidentDate
      ? Math.floor((currentDate - lastAccidentDate) / (1000 * 60 * 60 * 24))
      : 0;

    if (lastAccidentDate === null) {
      console.log("Primeiro acidente registrado.");
      daysWithoutAccident = 0;
    }

    // Atualiza o recorde de dias sem acidente
    updateRecord(daysWithoutAccident);

    // Impedir inserção duplicada
    db.get("SELECT date FROM accidents WHERE date = ?", [date], (err, existing) => {
      if (existing) {
        return res.status(400).json({ error: "⚠ Essa data já foi registrada!" });
      }

      // Registra o novo acidente no banco de dados
      db.run("INSERT INTO accidents (date) VALUES (?)", [date], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ message: " Data atualizada com sucesso!", date });
      });
    });
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
