const express = require("express");
const db = require("../../services/db");
const router = express.Router();

router.post("/create", (req, res) => {
    const { userid, roomid, capacity, url } = req.body;

    let newRoom = {
        "id": roomid,
        "userid": userid,
        "capacity": capacity,
        "url": url
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

router.get("/:roomid", (req, res) => {
    const roomid  = req.params.roomid;
    const sql = "SELECT * FROM rooms WHERE id = ?";
    db.query(sql, [roomid], (derr, dres) => {
        if(derr) {
          return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.length == 0) {
            return res.status(500).json({message: "Room does not exist"});
        }
        res.status(200).json({room: dres[0]});
    });
});

router.put("/url", (req, res) => {
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

router.put("/capacity", (req, res) => {
    const { roomid, capacity } = req.body;
    const sql = "UPDATE rooms SET capacity = ? WHERE id = ?";
    db.query(sql, [capacity, roomid], (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.affectedRows == 0) {
            return res.status(500).json({message: "Room does not exist"});
        }
        res.status(200).json({message: "Capacity updated..."});
    });
});

router.put("/host", (req, res) => {
    const { roomid, userid } = req.body;
    const sql = "UPDATE rooms SET userid = ? WHERE id = ?";
    db.query(sql, [userid, roomid], (derr, dres) => {
        if(derr) {
            return res.status(500).json({message: derr.message});
        }
        console.log(dres);
        if (dres.affectedRows == 0) {
            return res.status(500).json({message: "Room does not exist"});
        }
        res.status(200).json({message: "Host updated..."});
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
