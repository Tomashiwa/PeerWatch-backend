const express = require("express");
const db = require("../../services/db");
const router = express.Router();

router.post("/create", (req, res) => {
    const { hostId, roomId, capacity, url } = req.body;

    let newRoom = {
        "id": roomId,
        "host_id": hostId,
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

router.get("/:roomId", (req, res) => {
    const roomId  = req.params.roomId;
    const sql = "SELECT * FROM rooms WHERE id = ?";
    db.query(sql, [roomId], (derr, dres) => {
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
    const { roomId, url } = req.body;
    const sql = "UPDATE rooms SET url = ? WHERE id = ?";
    db.query(sql, [url, roomId], (derr, dres) => {
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
    const { roomId, capacity } = req.body;
    const sql = "UPDATE rooms SET capacity = ? WHERE id = ?";
    db.query(sql, [capacity, roomId], (derr, dres) => {
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
    const { roomId, hostId } = req.body;
    const sql = "UPDATE rooms SET host_id = ? WHERE id = ?";
    db.query(sql, [hostId, roomId], (derr, dres) => {
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
    const { roomId } = req.body;
    const sql = "DELETE FROM rooms WHERE id = ?";
    db.query(sql, [roomId], (derr, dres) => {
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
