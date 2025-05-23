const db = require("../lib/db");

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://acidente-planetaagua.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    db.get("SELECT date FROM accidents ORDER BY id DESC LIMIT 1", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ lastAccident: row ? row.date : null });
    });
  } else if (req.method === "POST") {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Data inválida" });

    db.get("SELECT date FROM accidents ORDER BY id DESC LIMIT 1", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      const lastDate = row ? new Date(row.date) : null;
      const now = new Date(date);
      const diff = lastDate ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)) : 0;

      db.get("SELECT max_days FROM record WHERE id = 1", [], (err, row) => {
        if (diff > (row?.max_days || 0)) {
          db.run("UPDATE record SET max_days = ? WHERE id = 1", [diff]);
        }

        db.get("SELECT date FROM accidents WHERE date = ?", [date], (err, existing) => {
          if (existing) return res.status(400).json({ error: "Essa data já foi registrada!" });

          db.run("INSERT INTO accidents (date) VALUES (?)", [date], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Data atualizada com sucesso!", date });
          });
        });
      });
    });
  } else {
    res.status(405).end(); 
  }
}
