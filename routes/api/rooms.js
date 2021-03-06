const express = require("express");
const db = require("../../services/db");
const router = express.Router();

router.post("/create", (req, res) => {
	const { hostId, roomId, capacity, url } = req.body;

	let newRoom = {
		roomId: roomId,
		hostId: hostId,
		url: url,
	};
	if (capacity != null) {
		newRoom.capacity = capacity;
	}

	const sql = "INSERT INTO rooms SET ?";
	db.query(sql, newRoom, (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		res.status(200).json({ message: "Room created..." });
	});
});

router.get("/:roomId", (req, res) => {
	const roomId = req.params.roomId;
	const sql = "SELECT * FROM rooms WHERE roomId = ?";
	db.query(sql, [roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.length == 0) {
			return res.status(500).json({ message: "Room does not exist" });
		}
		res.status(200).json({ room: dres[0] });
	});
});

router.put("/url", (req, res) => {
	const { roomId, url } = req.body;
	const sql = "UPDATE rooms SET url = ? WHERE roomId = ?";
	db.query(sql, [url, roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.affectedRows == 0) {
			return res.status(500).json({ message: "Room does not exist" });
		}
		res.status(200).json({ message: "URL updated..." });
	});
});

router.put("/capacity", (req, res) => {
	const { roomId, capacity } = req.body;
	if (capacity > 15 || capacity <= 0) {
		return res.status(500).json({ message: "Capacity is invalid" });
	}
	const sql = "UPDATE rooms SET capacity = ? WHERE roomId = ?";
	db.query(sql, [capacity, roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.affectedRows == 0) {
			return res.status(500).json({ message: "Room does not exist" });
		}
		res.status(200).json({ message: "Capacity updated..." });
	});
});

router.put("/host", (req, res) => {
	const { roomId, hostId } = req.body;
	const sql = "UPDATE rooms SET hostId = ? WHERE roomId = ?";
	db.query(sql, [hostId, roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.affectedRows == 0) {
			return res.status(500).json({ message: "Room does not exist" });
		}
		res.status(200).json({ message: "Host updated..." });
	});
});

router.delete("/delete", (req, res) => {
	const { roomId } = req.body;
	const sql = "DELETE FROM rooms WHERE roomId = ?";
	db.query(sql, [roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.affectedRows == 0) {
			return res.status(500).json({ message: "Room does not exist" });
		}
		res.status(200).json({ message: "Room deleted..." });
	});
});

router.post("/join", (req, res) => {
	const { userId, roomId } = req.body;
	let user = {
		userId: userId,
		roomId: roomId,
	};

	const countCapacitySql =
		"SELECT count(*) as count, (SELECT capacity FROM rooms WHERE rooms.roomId = ?) as capacity FROM users_in_rooms WHERE users_in_rooms.roomId = ?";

	db.query(countCapacitySql, [roomId, roomId], (countCapacityErr, countCapacityRes) => {
		if (countCapacityErr) {
			return res.status(500).json({ message: countCapacityErr.message });
		}
		if (countCapacityRes[0].count >= countCapacityRes[0].capacity) {
			return res.status(500).json({ message: "Room is full.." });
		}
		const joinRoomSql = "INSERT INTO users_in_rooms SET ?";
		db.query(joinRoomSql, user, (joinRoomErr, joinRoomRes) => {
			if (joinRoomErr) {
				return res.status(500).json({ message: joinRoomErr.message });
			}

			const usersSql = "SELECT * FROM users_in_rooms WHERE roomId = ?";

			db.query(usersSql, [roomId], (usersErr, usersRes) => {
				if (usersErr) {
					return res.status(500).json({ message: usersErr.message });
				}

				console.log(usersRes);
				return res.status(200).json(usersRes);
			});
		});
	});
});

router.put("/settings", (req, res) => {
	const { users, roomId } = req.body;
	let args = [];
	let sql = "";
	for (let i = 0; i < users.length; i++) {
		sql +=
			"UPDATE users_in_rooms SET canVideo = ?, canChat = ? WHERE userId = ? AND roomId = ?;";
		args.push(users[i].canVideo, users[i].canChat, users[i].userId, roomId);
	}
	db.query(sql, args, (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		const selectSql =
			"SELECT users_in_rooms.userId, users.displayName, users_in_rooms.canVideo, users_in_rooms.canChat" +
			" FROM users_in_rooms INNER JOIN users ON users.userId = users_in_rooms.userId WHERE roomId = ?";
		db.query(selectSql, [roomId], (selectErr, selectRes) => {
			if (derr) {
				return res.status(500).json({ message: selectErr.message });
			}
			console.log(selectRes);
			res.status(200).json(selectRes);
		});
	});
});

router.get("/:roomId/count", (req, res) => {
	const roomId = req.params.roomId;
	const sql =
		"SELECT count(*) as count, (SELECT capacity FROM rooms WHERE rooms.roomId = ?) as capacity FROM users_in_rooms WHERE users_in_rooms.roomId = ?";
	db.query(sql, [roomId, roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.length == 0) {
			return res.status(500).json({ message: "Room does not exist" });
		}
		res.status(200).json(dres[0]);
	});
});

router.get("/:roomId/users", (req, res) => {
	const { userId, roomId } = req.params;
	const sql =
		"SELECT users_in_rooms.userId, users.displayName, users_in_rooms.canVideo, users_in_rooms.canChat" +
		" FROM users_in_rooms INNER JOIN users ON users.userId = users_in_rooms.userId WHERE roomId = ?";
	db.query(sql, [roomId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		res.status(200).json(dres);
	});
});

router.get("/:roomId/:userId", (req, res) => {
	const { userId, roomId } = req.params;
	const sql = "SELECT * FROM users_in_rooms WHERE roomId = ? AND userId = ?";
	db.query(sql, [roomId, userId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		res.status(200).json({ user: dres[0] });
	});
});

router.post("/disconnect", (req, res) => {
	const { userId, roomId } = req.body;
	const sql = "DELETE FROM users_in_rooms WHERE roomId = ? AND userId = ?";
	db.query(sql, [roomId, userId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		console.log(dres);
		if (dres.affectedRows == 0) {
			return res.status(500).json({ message: "Room or user does not exist" });
		}
		res.status(200).json({ message: "User disconnected..." });
	});
});

module.exports = router;
