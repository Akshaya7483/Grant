const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

module.exports = {
  createUser: (username, email, password, callback) => {
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password],
      function (err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, this.lastID);
      });
  },
  getUserByUsername: (username, callback) => {
    db.get('SELECT id, username, email, password FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, row);
    });
  }
};
