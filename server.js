const express = require("express");
const mysql = require("mysql2");

// To-do: Use different connection based on node environment

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

const app = express();
const router = express.Router();

// Routes to test mysql2 library
router.get("/createUsersTable", (req, res) => {
    const sql = "CREATE TABLE users(id int AUTO_INCREMENT, name VARCHAR(255), password VARCHAR(255), PRIMARY KEY(id))";
    db.query(sql, (derr, dres) => {
        if(derr) throw derr;
        console.log(dres);
        res.status(200).json({message: "Table created..."});
    })
});
router.get("/addUser1", (req, res) => {
    const user = {
        name: "user",
        password: "password"
    };
    const sql = "INSERT INTO users SET ?";

    db.query(sql, user, (derr, dres) => {
        if(derr) throw derr;
        console.log(dres);
        res.status(200).json({message: "User created..."});
    });
})

app.use("/", router);

app.listen("3000", () => {
    console.log("Server started on port 3000...");
})