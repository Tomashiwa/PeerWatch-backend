const db = require("../services/db");

// Mapping a socket to the room it is in
const socketRoomMap = new Map();
// Mapping a room to all the sockets in the room
const roomSocketMap = new Map();
// Mapping a bufferer to a set of users that is ready to resume
const bufferReadysMap = new Map();
// Store rooms that are being held
const roomHoldersMap = new Map();
// Mapping socket ID to user ID
const socketUserMap = new Map();

const disconnectUser = (socketId, userId, roomId) => {
	const sql = "DELETE FROM users_in_rooms WHERE roomId = ? AND userId = ?";
	db.query(sql, [roomId, userId], (derr, dres) => {
		if (derr) {
			return res.status(500).json({ message: derr.message });
		}
		if (dres.affectedRows == 0) {
			console.log("Room or user does not exist");
		}
		socketUserMap.delete(socketId);
		console.log("User disconnected...");
	});
};

const deleteRoom = (roomId) => {
	const sql = "DELETE FROM rooms WHERE roomId = ?";
	db.query(sql, [roomId], (derr, dres) => {
		if (derr) {
			console.log(`Failed to delete room ${roomId}`);
			console.log(derr.message);
			return;
		}
		if (dres.affectedRows == 0) {
			console.log(`Room ${roomId} does not exist`);
			return;
		}

		console.log(`Room ${roomId} has been deleted`);
	});
};

module.exports = (io) => {
	const videoIO = io.of("/video");

	videoIO.on("connection", (socket) => {
		console.log(`${socket.id} connected to videoIO`);

		socket.on("REQUEST_ROOM_STATUS", (roomId) => {
			videoIO.to(socket.id).emit("RECEIVE_ROOM_STATUS", roomHoldersMap.has(roomId));
		});

		// Pair up socket id with a user id
		socket.on("SUBSCRIBE_USER_TO_SOCKET", (userId) => {
			if (!socketUserMap.has(socket.id)) {
				socketUserMap.set(socket.id, userId);
			}
		});

		// 1. Join room via id
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the video room ${roomId}`);
			socket.join(roomId);

			// Update mapping
			socketRoomMap.set(socket.id, roomId);
			if (roomSocketMap.has(roomId)) {
				roomSocketMap.set(roomId, [...roomSocketMap.get(roomId), socket.id]);
			} else {
				roomSocketMap.set(roomId, [socket.id]);
			}

			callback();
		});

		// 2. Cleanup after a user disconnects
		socket.on("disconnect", () => {
			const roomId = socketRoomMap.get(socket.id);

			if (socketUserMap.has(socket.id)) {
				disconnectUser(socket.id, socketUserMap.get(socket.id), roomId);
			}

			// Remove user from roomSocket map
			if (socketRoomMap.has(socket.id) && roomSocketMap.has(socketRoomMap.get(socket.id))) {
				const newSockets = roomSocketMap.get(roomId).filter((id) => id != socket.id);

				if (newSockets.length <= 0) {
					deleteRoom(roomId);
				} else {
					roomSocketMap.set(roomId, newSockets);
				}
			}

			if (
				bufferReadysMap.has(socket.id) ||
				(roomHoldersMap.has(roomId) && roomHoldersMap.get(roomId) == socket.id)
			) {
				// Recovery if the disconnected user is a bufferer
				console.log("RECOVERY from loss of bufferer when sync-ing");
				const buffererId = roomHoldersMap.get(roomId);
				const newBuffererId = roomSocketMap.get(roomId)[0];

				if (bufferReadysMap.has(buffererId)) {
					const bufferEntry = bufferReadysMap.get(buffererId);
					const newEntry = {
						roomId: bufferEntry.roomId,
						readys: bufferEntry.readys,
						target: bufferEntry.target - 1,
					};

					newEntry.readys.delete(newBuffererId);
					bufferReadysMap.delete(buffererId);
					bufferReadysMap.set(newBuffererId, newEntry);
				}

				videoIO.to(roomId).emit("SET_BUFFERER", newBuffererId);
			} else {
				// Recovery if the disconnected user is not a bufferer
				console.log("RECOVERY from loss of a user when sync-ing");
				const buffererId = roomHoldersMap.get(roomId);
				if (bufferReadysMap.has(buffererId)) {
					const bufferEntry = bufferReadysMap.get(buffererId);

					bufferEntry.readys.delete(socket.id);
					bufferEntry.target -= 1;

					console.log(`Excluded ${socket.id} from ${buffererId}'s buffer entry`);

					if (bufferEntry.readys.size >= bufferEntry.target) {
						console.log(
							`${buffererId} receive ${bufferEntry.readys.size} total readys, releasing all users in ${roomId}`
						);
						bufferReadysMap.delete(buffererId);
						roomHoldersMap.delete(roomId);
						socket.to(roomId).emit("RELEASE");
					} else {
						bufferReadysMap.set(socket.id, bufferEntry);
					}
				}
			}
		});

		// 3. Broadcast URL to all other users
		socket.on("SEND_URL", (roomId, url) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_URL", url);
				console.log(`${url} sent to room ${roomId}`);
			}
		});

		// 3. Broadcast timing to all other users
		socket.on("SEND_TIMING", (roomId, timing) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_TIMING", timing);
				console.log(`${socket.id} sent a timing of ${timing.timing} to room ${roomId}`);
			}
		});

		// 4. Ask all other users to wait
		socket.on("REQUEST_HOLD", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else if (roomHoldersMap.has(roomId)) {
				console.log(
					`Room ${roomId} is still being held, ignoring this HOLD request from ${socket.id}...`
				);
			} else {
				roomHoldersMap.set(roomId, socket.id);
				socket.to(roomId).emit("HOLD", socket.id);
				console.log(`${socket.id} ask all other users to HOLD`);
			}
		});

		// 5. Ask all other users to prepare to resume at a given timing
		socket.on("REQUEST_RELEASE", (roomId, newTiming) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else if (bufferReadysMap.has(socket.id)) {
				console.log(
					`${socket.id} is already waiting for release, ignoring this release request...`
				);
			} else {
				const numOfUsers = roomSocketMap.get(roomId).length - 1;

				if (numOfUsers == 0) {
					console.log(
						`There are no other users to prepare resume for, bufferer will be release immediately`
					);
					bufferReadysMap.delete(socket.id);
					roomHoldersMap.delete(roomId);
					videoIO.to(socket.id).emit("RELEASE");
				}

				console.log(
					`${socket.id} requests for ${numOfUsers} unique readys at ${newTiming}`
				);

				if (!bufferReadysMap.has(socket.id)) {
					bufferReadysMap.set(socket.id, {
						roomId,
						readys: new Set(),
						target: numOfUsers,
					});
				}
				socket.to(roomId).emit("PREPARE_RELEASE", newTiming);
			}
		});

		// 6. Tell the server that this user is ready to resume
		socket.on("REQUEST_RELEASE_READY", (roomId, buffererId, releaseSelfCallback) => {
			if (!bufferReadysMap.has(buffererId)) {
				if (roomHoldersMap.has(roomId)) {
					console.log(
						`${socket.id}: Buffer entry for ${buffererId} not found but the buffering room exists, creating a buffer entry... (Total: 1)`
					);

					const numOfUsers = roomSocketMap.get(roomId).length - 1;

					if (numOfUsers == 1) {
						console.log(
							`${buffererId} receive 1 total unique readys, releasing all users in ${roomId} by REQUEST_RELEASE_READY`
						);
						console.log(`Removing ${roomId} from holdSet`);
						roomHoldersMap.delete(roomId);
						videoIO.to(roomId).emit("RELEASE");
					} else {
						const readySet = new Set();
						readySet.add(socket.id);
						bufferReadysMap.set(buffererId, {
							roomId,
							readys: readySet,
							target: numOfUsers,
						});
					}
				} else {
					console.log(
						`Buffer entry for ${buffererId} not found and there is no room for it, ignoring this ready...`
					);
				}
			} else {
				const newEntry = bufferReadysMap.get(buffererId);
				newEntry.readys.add(socket.id);

				console.log(`${socket.id} sent a ready (Total: ${newEntry.readys.size})`);

				if (newEntry.readys.size >= newEntry.target) {
					console.log(
						`${buffererId} receive ${newEntry.readys.size} total unique readys, releasing all users in ${roomId} REQUEST_RELEASE_ALL _ HAS BUFFER`
					);
					console.log(`Removing ${roomId} from holdSet`);

					bufferReadysMap.delete(buffererId);
					roomHoldersMap.delete(roomId);
					socket.to(roomId).emit("RELEASE");
					releaseSelfCallback();
				} else {
					bufferReadysMap.set(buffererId, newEntry);
				}
			}
		});

		// 7. Ask all other users to resume from holding
		socket.on("REQUEST_RELEASE_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				console.log(`${socket.id} releasing all users in ${roomId} by REQUEST_RELEASE_ALL`);
				console.log(`Removing ${roomId} from holdSet`);
				bufferReadysMap.delete(socket.id);
				roomHoldersMap.delete(roomId);
				socket.to(roomId).emit("RELEASE");
			}
		});

		// 8. Ask all other users to resume playing
		socket.on("PLAY_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("PLAY");
			}
		});

		// 9. Ask all other users to pause
		socket.on("PAUSE_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("PAUSE");
			}
		});

		// 10. Ask all other users to change playback rate to a given value
		socket.on("PLAYBACK_RATE_CHANGE_ALL", (roomId, newRate) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("PLAYBACK_RATE_CHANGE", newRate);
			}
		});

		// Ask the room's host for the playback setting
		socket.on("REQUEST_SETTINGS", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("QUERY_SETTINGS", socket.id);
			}
		});

		// PM a reciepient with a playback setting
		socket.on("REPLY_SETTINGS", (roomId, recipientId, settings) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_SETTINGS", recipientId, settings);
			}
		});
	});
};
