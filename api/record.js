const db = require("../lib/db");

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    db.get("SELECT max_days FROM record WHERE id = 1", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ record: row ? row.max_days : 0 });
    });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
