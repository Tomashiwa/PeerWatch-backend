const express = require("express");
const db = require("../../services/db");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

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

router.post("/create", (req, res) => {
    const { email, name, password, isGoogle } = req.body;
    if (!name || !password || !email) {
        return res.status(400).json({message: "Please enter all fields (email, name & password) to become an user"});
    }
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({message: err.message});
        }
        let newUser = {
            "email": email,
            "display_name": name,
            "password": hash,
            "is_google": !!isGoogle
        };
        const sql = "INSERT INTO users SET ?";
        db.query(sql, newUser, (derr, dres) => {
            if(derr) {
                return res.status(500).json({message: derr.message});
            }
            console.log(dres);
            res.status(200).json({message: "User created..."});
        });
    });
});

router.post("/login", (req, res) => {
    const { email, password, isGoogle } = req.body;
    if (!password || !email) {
        return res.status(400).json({message: "Please enter all fields (email & password) to login"});
    }
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.length == 0) {
            return res.status(500).json({message: "Email does not exist"});
        }

        bcrypt.compare(password, dres[0].password, (err, comparison) => {
            if (err) {
                return res.status(500).json({message: err.message});
            }
            if (dres[0].is_google == 1) {
                res.status(500).json({message: "Please login via Google Auth"})
            } else if (comparison) {
                res.status(200).json({message: "Login success"});
            } else {
                res.status(500).json({message: "Wrong password"});
            }
        });
    });
});

router.put("/password", (req, res) => {
    const { userid, password } = req.body
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            return res.status(500).json({message: err.message});
        }
        const sql = "UPDATE users SET password = ? WHERE id = ?";
        db.query(sql, [hash, userid], (derr, dres) => {
            if(derr) {
                return res.status(500).json({message: derr.message});
            }
            console.log(dres);
            res.status(200).json({message: "Password updated..."});
        });
    });
});

router.put("/name", (req, res) => {
    const { name, userid } = req.body;
    const sql = "UPDATE users SET display_name = ? WHERE id = ?";
    db.query(sql, [name, userid], (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.affectedRows == 0) {
            return res.status(500).json({message: "User does not exist"});
        }
        res.status(200).json({message: "Name updated..."});
    });
});

module.exports = router;
