const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'database.sqlite'));

db.serialize(() => {
  const users = [
    { name: 'Bob Builder', email: 'bob@systech.com', role: 'employee', skills: ['python', 'sql', 'azure'], exp: 'experienced', years: 3 },
    { name: 'Charlie Chap', email: 'charlie@systech.com', role: 'employee', skills: ['dbt', 'snowflake', 'python'], exp: 'experienced', years: 2 },
    { name: 'Diana Prince', email: 'diana@systech.com', role: 'employee', skills: ['sql', 'snowflake'], exp: 'experienced', years: 5 },
    { name: 'Evan Wright', email: 'evan@systech.com', role: 'employee', skills: ['react', 'node', 'sql'], exp: 'fresher', years: 1 },
    { name: 'Fiona Gallagher', email: 'fiona@systech.com', role: 'employee', skills: ['azure', 'dbt', 'python'], exp: 'experienced', years: 4 }
  ];

  let completed = 0;

  users.forEach(u => {
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, 'password123', ?)", [u.name, u.email, u.role], function(err) {
      if (err) return console.error(err);
      const newId = this.lastID;
      
      u.skills.forEach(skill => {
        db.run("INSERT INTO skills (userId, skillName, isVerified) VALUES (?, ?, 1)", [newId, skill]);
      });
      
      db.run("INSERT INTO experience (userId, type, years) VALUES (?, ?, ?)", [newId, u.exp, u.years], () => {
        completed++;
        if (completed === users.length) {
          db.close(() => console.log('5 demo users with verified skills added successfully.'));
        }
      });
    });
  });
});
