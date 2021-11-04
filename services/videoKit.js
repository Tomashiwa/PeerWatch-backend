const db = require("../services/db");
const { redisClient, client } = require("./redis");
const fs = require("fs");

const VIDEO_PREFIX_SOCKETROOM = "VIDEO_SOCKETROOM";
const VIDEO_PREFIX_ROOMSOCKETS = "VIDEO_ROOMSOCKETS";
const VIDEO_PREFIX_BUFFERREADYS = "VIDEO_BUFFERREADYS";
const VIDEO_PREFIX_ROOMHOLDERS = "VIDEO_ROOMHOLDERS";
const VIDEO_PREFIX_SOCKETUSER = "VIDEO_SOCKETUSER";

const ENTRYFOUND_REACHED = "ENTRYFOUND_REACHED";
const ENTRYFOUND_INSUFFICIENT = "ENTRYFOUND_INSUFFICIENT";
const ENTRYNOTFOUND_HELD_USER = "ENTRYNOTFOUND_HELD_USER";
const ENTRYNOTFOUND_HELD_MULTIUSER = "ENTRYNOTFOUND_HELD_MULTIUSER";

const ENTRYFOUND_IGNOREREQUEST = "ENTRYFOUND_IGNOREREQUEST";
const ENTRYNOTFOUND_NOUSER_RELEASE = "ENTRYNOTFOUND_NOUSER_RELEASE";
const ENTRYNOTFOUND_USERS_REQUEST = "ENTRYNOTFOUND_USERS_REQUEST";

const MAX_DISCONNECTION_RETRIES = 3;

const disconnectUser = (socketId, userId, roomId, retries) => {
	if (retries <= 0) {
		console.log(`User ${userId} failed to disconnect after retrying, abort disonnection`);
		return;
	}

	const sql = "DELETE FROM users_in_rooms WHERE roomId = ? AND userId = ?";
	db.query(sql, [roomId, userId], (derr, dres) => {
		if (derr) {
			console.log(`User ${userId} failed to disconnect, attempting another disconnect...`);
			disconnectUser(socketId, userId, roomId, retries - 1);
			return;
		}

		redisClient
			.del(`${VIDEO_PREFIX_SOCKETUSER}_${socketId}`)
			.then((res) => {})
			.catch((err) => console.log(err));

		if (dres.affectedRows === 0) {
			console.log("Room or user does not exist");
		} else {
			console.log("User disconnected...");
		}
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
			redisClient
				.exists(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.then((exists) => videoIO.to(socket.id).emit("RECEIVE_ROOM_STATUS", exists === 1))
				.catch((err) => console.log(err));
		});

		// Pair up socket id with a user id
		socket.on("SUBSCRIBE_USER_TO_SOCKET", (userId) => {
			redisClient
				.exists(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`)
				.then((existRes) => {
					if (existRes === 1) {
						console.log(`Subscription already exists: ${existRes}`);
					} else {
						redisClient
							.set(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`, userId)
							.then((appendRes) => console.log("Subscription success"))
							.catch((appendErr) => console.log(appendErr));
					}
				})
				.catch((err) => console.log(err));
		});

		// 1. Join room via id
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the video room ${roomId}`);
			socket.join(roomId);

			redisClient
				.set(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`, roomId)
				.then((appendRes) =>
					redisClient.sadd(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`, socket.id)
				)
				.then((saddRes) => console.log("JOINED ROOM"))
				.catch((err) => console.log(err))
				.finally(() => callback());

			callback();
		});

		// 2. Cleanup after a user disconnects
		const deleteSocketFromRoom = (roomId) => {
			redisClient
				.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
				.then((size) => {
					if (size === 1) {
						console.log("Room deleted");
						deleteRoom(roomId);
					}
					return redisClient.srem(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`, socket.id);
				})
				.then((remRes) => redisClient.del(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`))
				.then((delRes) => console.log(`Removed user from room ${roomId}`))
				.catch((setErr) => console.log(setErr));
		};

		const passDownBufferer = (roomId, bufferEntry) => {
			redisClient
				.smembers(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
				.then((sockets) => {
					const newSockets = sockets.filter((s) => s !== socket.id);
					const nextBufferer = newSockets[0];

					if (!bufferEntry) {
						console.log("Immediate pass to next bufferer without entry");
						videoIO.to(roomId).emit("SET_BUFFERER", nextBufferer, newSockets[0]);
						return;
					}

					const newEntry = {
						roomId: bufferEntry.roomId,
						readys: bufferEntry.readys.filter((ready) => ready != nextBufferer),
						target: bufferEntry.target - 1,
					};

					client
						.multi()
						.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
						.set(
							`${VIDEO_PREFIX_BUFFERREADYS}_${nextBufferer}`,
							JSON.stringify(newEntry)
						)
						.exec((err) => {
							if (err) {
								console.log(err);
								return;
							}
							videoIO.to(roomId).emit("SET_BUFFERER", nextBufferer, newSockets[0]);
						});
				})
				.catch((err) => console.log(err));
		};

		const removeSelfFromBuffer = (roomId) => {
			redisClient
				.get(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.then((buffererId) => {
					if (!buffererId) {
						console.log(`buffererId not found`);
						return;
					}

					redisClient
						.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
						.then((entryStr) => {
							if (!entryStr) {
								console.log(`entryStr not found`);
								return;
							}

							const entry = JSON.parse(entryStr);
							const newEntry = {
								roomId: entry.roomId,
								readys: entry.ready.filter((read) => ready != socket.id),
								target: entry.target - 1,
							};
							if (newEntry.readys.length >= newEntry.target) {
								redisClient
									.del(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
									.then((delRes) =>
										redisClient.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
									)
									.then((delRes) =>
										console.log("Received all users, releasing all readys")
									)
									.catch((delErr) => console.log(delErr));
							} else {
								redisClient
									.set(
										`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`,
										JSON.stringify(newEntry)
									)
									.then((appendRes) => console.log("Update buffer entry"))
									.catch((appendErr) => console.log(appendErr));
							}
						})
						.catch((bufferErr) => console.log(bufferErr));
				})
				.catch((roomErr) => console.log(roomErr));
		};

		socket.on("disconnect", () => {
			console.log(`${socket.id} has left the video video room`);

			const getRoomId = redisClient.get(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`);
			const getUserId = redisClient.get(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`);

			Promise.all([getRoomId, getUserId])
				.then((res) => {
					const roomId = res[0];
					const userId = parseInt(res[1]);
					disconnectUser(socket.id, userId, roomId, MAX_DISCONNECTION_RETRIES);
					deleteSocketFromRoom(roomId);

					client
						.multi()
						.get(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`, (err, str) =>
							console.log(`results: ${str}`)
						)
						.exec();

					let isBufferer = 0;
					let roomHasHolder = 0,
						socketIsHolder = 0;

					client
						.multi()
						.exists(
							`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`,
							(err, res) => (isBufferer = res)
						)
						.exists(
							`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
							(err, res) => (roomHasHolder = res)
						)
						.get(
							`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
							(err, res) => (socketIsHolder = res === socket.id)
						)
						.exec((err) => {
							if (err) {
								console.log("ERROR HAPPENED");
								return;
							}

							if (isBufferer || (roomHasHolder && socketIsHolder)) {
								let entryStr;
								client
									.multi()
									.get(
										`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`,
										(err, res) => (entryStr = res)
									)
									.exec((err) => {
										if (err) {
											console.log(err);
											return;
										}
										passDownBufferer(roomId, JSON.parse(entryStr));
									});
							} else {
								removeSelfFromBuffer(roomId);
							}
						});
				})
				.catch((err) => console.log(err));
		});

		// 3. Broadcast URL to all other users
		socket.on("SEND_URL", (roomId, url) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_URL", url);
			}
		});

		// 3. Broadcast timing to all other users
		socket.on("SEND_TIMING", (roomId, timing) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("RECEIVE_TIMING", timing);
			}
		});

		// 4. Ask all other users to wait
		socket.on("REQUEST_HOLD", (roomId) => {
			console.log(`${socket.id} requesting HOLD on all other users`);

			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			let isRoomHeld = 0;
			client
				.multi()
				.exists(
					`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
					(err, value) => (isRoomHeld = value)
				)
				.exec((existErr) => {
					if (existErr) {
						console.log("Error checking if room is held");
						return;
					}

					if (isRoomHeld === 1) {
						console.log(`Room ${roomId} held, ignoring HOLD from ${socket.id}...`);
					} else {
						client
							.multi()
							.set(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`, socket.id)
							.exec((setErr) => {
								if (setErr) {
									console.log("Error when setting bufferer");
									return;
								}
								socket.to(roomId).emit("HOLD", socket.id);
							});
					}
				});
		});

		// 5. Ask all other users to prepare to resume at a given timing
		socket.on("REQUEST_RELEASE", (roomId, newTiming) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			client.eval(
				fs.readFileSync("release.lua"),
				3,
				`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`,
				`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
				`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`,
				roomId,
				"",
				"",
				(err, res) => {
					if (err) {
						console.log("Error while evaluating lua script:");
						console.log(err);
					} else if (res === ENTRYFOUND_IGNOREREQUEST) {
						console.log(
							`${socket.id} is already waiting for release, ignoring this release request...`
						);
					} else if (res === ENTRYNOTFOUND_NOUSER_RELEASE) {
						console.log("No buffer entry found, no other users found, just release");
						videoIO.to(socket.id).emit("RELEASE");
					} else if (res === ENTRYNOTFOUND_USERS_REQUEST) {
						console.log(
							"No buffer entry found, users found, ask all prepare to release"
						);
						socket.to(roomId).emit("PREPARE_RELEASE", newTiming);
					} else {
						console.log("INVALID RESULT");
					}
				}
			);
		});

		// 6. Tell the server that this user is ready to resume
		socket.on("REQUEST_RELEASE_READY", async (roomId, buffererId, releaseSelfCallback) => {
			client.eval(
				fs.readFileSync("releaseReady.lua"),
				3,
				`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`,
				`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`,
				`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`,
				roomId,
				socket.id,
				"",
				(err, res) => {
					if (err) {
						console.log("Erro while evaluating lua script:");
						console.log(err);
					} else if (res === ENTRYFOUND_REACHED) {
						console.log(
							"Buffer entry found + # of readys reached target => emit release + release self callback"
						);
						socket.to(roomId).emit("RELEASE");
						releaseSelfCallback();
					} else if (res === ENTRYFOUND_INSUFFICIENT) {
						console.log("Buffer entry found + insufficent # of readys => nothing");
					} else if (res === ENTRYNOTFOUND_HELD_USER) {
						console.log(
							"Buffer entry not found + Room is being held + Only 1 user => emit release"
						);
						videoIO.to(roomId).emit("RELEASE");
					} else if (res === ENTRYNOTFOUND_HELD_MULTIUSER) {
						console.log(
							"Buffer entry not found + Room is being held + >1 user => nothing"
						);
					} else {
						console.log("INVALID RESULT");
					}
				}
			);
		});

		// 7. Ask all other users to resume from holding
		socket.on("REQUEST_RELEASE_ALL", (roomId) => {
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			client
				.multi()
				.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
				.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.exec((err) => {
					if (err) {
						console.log(err);
						return;
					}
					socket.to(roomId).emit("RELEASE");
				});
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
