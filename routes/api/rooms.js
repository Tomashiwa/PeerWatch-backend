const express = require("express");
const db = require("../../services/db");
const router = express.Router();

router.post("/create", (req, res) => {
    const { userid, roomid, capacity } = req.body;

    let newRoom = {
        "id": roomid,
        "userid": userid,
        "capacity": capacity
    };

    const sql = "INSERT INTO rooms SET ?";
    db.query(sql, newRoom, (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        res.status(200).json({message: "Room created..."});
    });

});

router.put("/url/update", (req, res) => {
    const { roomid, url } = req.body;
    const sql = "UPDATE rooms SET url = ? WHERE id = ?";
    db.query(sql, [url, roomid], (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.affectedRows == 0) {
            return res.status(500).json({message: "Room does not exist"});
        }
        res.status(200).json({message: "URL updated..."});
    });
});

router.get("/url", (req, res) => {
    const { roomid } = req.query;
    const sql = "SELECT url FROM rooms WHERE id = ?";
    db.query(sql, [roomid], (derr, dres) => {
        if(derr) {
          return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.length == 0) {
            return res.status(500).json({message: "Room does not exist"});
        }
        res.status(200).json({url: dres[0].url});
    });
});

router.delete("/delete", (req, res) => {
    const { roomid } = req.body;
    const sql = "DELETE FROM rooms WHERE id = ?";
    db.query(sql, [roomid], (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.affectedRows == 0) {
            return res.status(500).json({message: "Room does not exist"});
        }
        res.status(200).json({message: "Room deleted..."});
    });
});

module.exports = router;