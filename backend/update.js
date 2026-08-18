const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.run("UPDATE users SET email='swethap@systechusa.com', password='Vidhparth@04' WHERE name='Swetha'", (err) => {
  if (err) console.error(err);
  else console.log('Updated Swetha record in sqlite DB');
});
