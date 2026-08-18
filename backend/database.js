const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database.');
    initializeSchema();
  }
});

function initializeSchema() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // Skills table
    db.run(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        skillName TEXT,
        isVerified BOOLEAN DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Experience table
    db.run(`
      CREATE TABLE IF NOT EXISTS experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        type TEXT,
        years INTEGER,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    // Seed mock data if empty
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (row && row.count === 0) {
        db.run("INSERT INTO users (name, email, password, role) VALUES ('Alice Chen', 'alice@systech.com', 'password123', 'employee')");
        db.run("INSERT INTO users (name, email, password, role) VALUES ('David Smith', 'david@systech.com', 'password123', 'employee')");
        db.run("INSERT INTO users (name, email, password, role) VALUES ('Sarah Manager', 'sarah@systech.com', 'admin123', 'manager')");
        
        // Add requested credentials
        db.run("INSERT INTO users (name, email, password, role) VALUES ('Swetha', 'swethap@systechusa.com', 'Vidhparth@04', 'employee')");
        db.run("INSERT INTO users (name, email, password, role) VALUES ('Manager', 'manager@systech.com', 'admin123', 'manager')");
        db.run("INSERT INTO users (name, email, password, role) VALUES ('Ruthu', 'ruthu@sustechusa.com', 'pulse123', 'employee')");
        db.run("INSERT INTO users (name, email, password, role) VALUES ('Ruthu (Alt)', 'ruthu@systechusa.com', 'pulse123', 'employee')");
        
        // Alice skills
        db.run("INSERT INTO skills (userId, skillName, isVerified) VALUES (1, 'python', 1)");
        db.run("INSERT INTO skills (userId, skillName, isVerified) VALUES (1, 'snowflake', 1)");
        db.run("INSERT INTO experience (userId, type, years) VALUES (1, 'experienced', 4)");
        
        // David skills
        db.run("INSERT INTO skills (userId, skillName, isVerified) VALUES (2, 'sql', 1)");
        db.run("INSERT INTO skills (userId, skillName, isVerified) VALUES (2, 'dbt', 1)");
        db.run("INSERT INTO experience (userId, type, years) VALUES (2, 'experienced', 3)");
        
        console.log('Mock database seeded with passwords.');
      }
    });
  });
}

module.exports = db;
