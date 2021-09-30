const express = require("express");
const db = require("../../services/db");
const router = express.Router();

// Temporary routes to test mysql2 library
router.get("/createtable", (req, res) => {
    const sql = "CREATE TABLE users(id int AUTO_INCREMENT, name VARCHAR(255), password VARCHAR(255), PRIMARY KEY(id))";
    db.query(sql, (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        res.status(200).json({message: "Table created..."});
    })
});

router.post("/", (req, res) => {
    const { name, password } = req.body;
    if(!name || !password) {
        return res.status(400).json({message: "Please enter all fields (name & password) to become an user"});
    }

    const sql = "INSERT INTO users SET ?";
    db.query(sql, req.body, (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        res.status(200).json({message: "User created..."});
    });
});

module.exports = router;