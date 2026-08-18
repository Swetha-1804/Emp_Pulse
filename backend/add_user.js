const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));
db.serialize(() => {
  db.run("INSERT INTO users (name, email, password, role) VALUES ('Ruthu', 'ruthu@sustechusa.com', 'pulse123', 'employee')");
  db.run("INSERT INTO users (name, email, password, role) VALUES ('Ruthu (Alt)', 'ruthu@systechusa.com', 'pulse123', 'employee')");
});
db.close(() => console.log('Users added successfully.'));
