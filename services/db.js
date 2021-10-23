const dotenv = require("dotenv");
const mysql = require("mysql2");

const env_var = dotenv.config();

if (env_var.error) {
	console.log("Failed to retrieve DB info stored as environment variables");
}

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: "peerwatch", // Need this in order to work
});

db.connect((err) => {
	if (err) {
		console.log(`DB error: ${err.message}`);
	} else {
		console.log("DB connected...");
	}
});

module.exports = db;
