const Database = require("better-sqlite3");

const db = new Database("chat.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    role TEXT,
    content TEXT,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
  );
`);

module.exports = db;
