const mysql = require("mysql2");

// To-do: Use different connections based on node environment

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "peerwatch"
});

db.connect((err) => {
    if (err) {
        console.log(`DB error: ${err.message}`);
    } else {
        console.log("DB connected...");
    }
});

module.exports = db;