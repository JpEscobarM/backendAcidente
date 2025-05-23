const db = require("../lib/db");

module.exports = (req, res) => {
  if (req.method === "GET") {
    db.get("SELECT max_days FROM record WHERE id = 1", [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ record: row ? row.max_days : 0 });
    });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
};
