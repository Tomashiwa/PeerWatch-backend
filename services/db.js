const dotenv = require("dotenv");
const mysql = require("mysql2");

const env_var = dotenv.config();

if (env_var.error) {
	console.log("Failed to retrieve DB info stored as environment variables");
}

const pool = mysql.createPool({
	host: process.env.NODE_ENV === "production" ? process.env.DB_HOST : process.env.LOCAL_DB_HOST,
	port: process.env.NODE_ENV === "production" ? process.env.DB_PORT : process.env.LOCAL_DB_PORT,
	user: process.env.NODE_ENV === "production" ? process.env.DB_USER : process.env.LOCAL_DB_USER,
	password:
		process.env.NODE_ENV === "production" ? process.env.DB_PASS : process.env.LOCAL_DB_PASS,
	database: process.env.NODE_ENV === "production" ? process.env.DB_NAME : "peerwatch",
	multipleStatements: true,
	connectionLimit: 75,
});

pool.on("connection", (connection) => {
	console.log(`New connection made, ${connection.threadId}`);
});

pool.on("acquire", (connection) => {
	console.log(`Connection ${connection.threadId} acquired from pool`);
});

pool.on("release", (connection) => {
	console.log(`Connection ${connection.threadId} released back to pool`);
});

module.exports = {
	query: function () {
		var sql_args = [];
		var args = [];
		for (var i = 0; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		var callback = args[args.length - 1];

		pool.getConnection(function (err, connection) {
			if (err) {
				console.log(err);
				return callback(err);
			}
			if (args.length > 2) {
				sql_args = args[1];
			}

			connection.query(args[0], sql_args, function (err, results) {
				// Always put connection back in pool after last query
				connection.release();

				if (err) {
					console.log(err);
					return callback(err);
				}
				callback(null, results);
			});
		});
	},
};
