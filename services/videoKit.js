const db = require("../services/db");
const redis = require("./redis");
const { redisClient, redisClientMulti, client } = require("./redis");

// Mapping a socket to the room it is in
const socketRoomMap = new Map();
// Mapping a room to all the sockets in the room
const roomSocketMap = new Map();
// Mapping a bufferer to a set of users that is ready to resume
const bufferReadysMap = new Map();
// Store rooms that are being held
const roomHoldersMap = new Map();

const VIDEO_PREFIX_SOCKETROOM = "VIDEO_SOCKETROOM";
const VIDEO_PREFIX_ROOMSOCKETS = "VIDEO_ROOMSOCKETS";
const VIDEO_PREFIX_BUFFERREADYS = "VIDEO_BUFFERREADYS";
const VIDEO_PREFIX_ROOMHOLDERS = "VIDEO_ROOMHOLDERS";
const VIDEO_PREFIX_SOCKETUSER = "VIDEO_SOCKETUSER";

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

			// videoIO.to(socket.id).emit("RECEIVE_ROOM_STATUS", roomHoldersMap.has(roomId));
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

			// Update mapping
			// socketRoomMap.set(socket.id, roomId);
			// if (roomSocketMap.has(roomId)) {
			// 	roomSocketMap.set(roomId, [...roomSocketMap.get(roomId), socket.id]);
			// } else {
			// 	roomSocketMap.set(roomId, [socket.id]);
			// }

			console.log("JOINED ROOM");
			callback();
		});

		// 2. Cleanup after a user disconnects
		const deleteSocketFromRoom = (roomId) => {
			redisClient
				.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
				.then((size) => {
					if (size === 1) {
						deleteRoom(roomId);
					}
					return redisClient.srem(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`, socket.id);
				})
				.then((remRes) => redisClient.del(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`))
				.then((delRes) => console.log(`Removed user from room ${roomId}`))
				.catch((setErr) => console.log(setErr));
		};

		const passDownBufferer = (roomId, bufferEntry) => {
			console.log("ENTRY to PASS DOWN:");
			console.log(bufferEntry);

			redisClient
				.smembers(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
				.then((sockets) => {
					const nextBufferer = sockets[0];
					const newEntry = {
						roomId: bufferEntry.roomId,
						readys: bufferEntry.readys.filter((ready) => ready != nextBufferer),
						target: bufferEntry.target - 1,
					};
					redisClient
						.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
						.then((delRes) => {
							console.log(
								`SET ${VIDEO_PREFIX_BUFFERREADYS}_${nextBufferer} => ${JSON.stringify(
									newEntry
								)}`
							);
							redisClient.set(
								`${VIDEO_PREFIX_BUFFERREADYS}_${nextBufferer}`,
								JSON.stringify(newEntry)
							);
						})
						.then((appendRed) => videoIO.to(roomId).emit("SET_BUFFERER", nextBufferer))
						.catch((err) => console.log(err));
				})
				.catch((err) => console.log(err));
		};

		const removeSelfFromBuffer = (roomId) => {
			redisClient
				.get(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.then((buffererId) => {
					redisClient
						.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
						.then((entryStr) => {
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
								console.log(
									`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}'s entryStr: ${newEntry}`
								);
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
			console.log("LEFT ROOM");
			// const roomId = socketRoomMap.get(socket.id);

			///////////////////////////////////////////
			const getRoomId = redisClient.get(`${VIDEO_PREFIX_SOCKETROOM}_${socket.id}`);
			const getUserId = redisClient.get(`${VIDEO_PREFIX_SOCKETUSER}_${socket.id}`);

			Promise.all([getRoomId, getUserId])
				.then((res) => {
					const roomId = res[0];
					const userId = parseInt(res[1]);
					disconnectUser(socket.id, userId, roomId, MAX_DISCONNECTION_RETRIES);
					deleteSocketFromRoom(roomId);

					redisClient
						.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
						.then((exists) => {
							if (exists === 1) {
								redisClient
									.get(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
									.then((entryStr) => {
										if (entryStr) {
											console.log(
												`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}'s entryStr: ${entryStr}`
											);
											passDownBufferer(roomId, JSON.parse(entryStr));
										}
									})
									.catch((bufferErr) => removeSelfFromBuffer(roomId));
							}
						})
						.catch((existErr) => console.log(existErr));

					// redisClient
					// 	.get(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
					// 	.then((entryStr) => {
					// 		if (entryStr) {
					// 			console.log(
					// 				`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}'s entryStr: ${entryStr}`
					// 			);
					// 			passDownBufferer(roomId, JSON.parse(entryStr));
					// 		}
					// 	})
					// 	.catch((bufferErr) => removeSelfFromBuffer(roomId));
				})
				.catch((err) => console.log(err));
			///////////////////////////////////////////

			// // Remove user from roomSocket map
			// if (socketRoomMap.has(socket.id) && roomSocketMap.has(socketRoomMap.get(socket.id))) {
			// 	const newSockets = roomSocketMap.get(roomId).filter((id) => id != socket.id);

			// 	socketRoomMap.delete(socket.id);
			// 	if (newSockets.length <= 0) {
			// 		deleteRoom(roomId);
			// 	} else {
			// 		roomSocketMap.set(roomId, newSockets);
			// 	}
			// }

			// if (
			// 	bufferReadysMap.has(socket.id) ||
			// 	(roomHoldersMap.has(roomId) && roomHoldersMap.get(roomId) == socket.id)
			// ) {
			// 	// Recovery if the disconnected user is a bufferer
			// 	console.log("RECOVERY from loss of bufferer when sync-ing");
			// 	const buffererId = roomHoldersMap.get(roomId);
			// 	const newBuffererId = roomSocketMap.get(roomId)[0];

			// 	if (bufferReadysMap.has(buffererId)) {
			// 		const bufferEntry = bufferReadysMap.get(buffererId);
			// 		const newEntry = {
			// 			roomId: bufferEntry.roomId,
			// 			readys: bufferEntry.readys,
			// 			target: bufferEntry.target - 1,
			// 		};

			// 		newEntry.readys.delete(newBuffererId);
			// 		bufferReadysMap.delete(buffererId);
			// 		bufferReadysMap.set(newBuffererId, newEntry);
			// 	}

			// 	videoIO.to(roomId).emit("SET_BUFFERER", newBuffererId);
			// } else {
			// 	// Recovery if the disconnected user is not a bufferer
			// 	console.log("RECOVERY from loss of a user when sync-ing");
			// 	const buffererId = roomHoldersMap.get(roomId);
			// 	if (bufferReadysMap.has(buffererId)) {
			// 		const bufferEntry = bufferReadysMap.get(buffererId);

			// 		bufferEntry.readys.delete(socket.id);
			// 		bufferEntry.target -= 1;

			// 		console.log(`Excluded ${socket.id} from ${buffererId}'s buffer entry`);

			// 		if (bufferEntry.readys.size >= bufferEntry.target) {
			// 			console.log(
			// 				`${buffererId} receive ${bufferEntry.readys.size} total readys, releasing all users in ${roomId}`
			// 			);
			// 			bufferReadysMap.delete(buffererId);
			// 			roomHoldersMap.delete(roomId);
			// 			socket.to(roomId).emit("RELEASE");
			// 		} else {
			// 			bufferReadysMap.set(socket.id, bufferEntry);
			// 		}
			// 	}
			// }
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
			console.log(`${socket.id} requesting HOLD on all other users`);

			/////////////////////////////////////////////
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			redisClient
				.exists(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
				.then((exists) => {
					if (exists === 1) {
						console.log(
							`Room ${roomId} being held, ignoring HOLD from ${socket.id}...`
						);
					} else {
						redisClient
							.set(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`, socket.id)
							.then((appendRes) => {
								console.log(`${socket.id} ask all other users to HOLD`);
								socket.to(roomId).emit("HOLD", socket.id);
							})
							.catch((appendErr) => {
								console.log(err);
							});
					}
				})
				.catch((err) => {
					console.log(err);
				});
			/////////////////////////////////////////////

			// if (roomId === "") {
			// 	console.log(`Invalid room ID: ${roomId}`);
			// } else if (roomHoldersMap.has(roomId)) {
			// 	console.log(
			// 		`Room ${roomId} is still being held, ignoring this HOLD request from ${socket.id}...`
			// 	);
			// } else {
			// 	roomHoldersMap.set(roomId, socket.id);
			// 	socket.to(roomId).emit("HOLD", socket.id);
			// 	console.log(`${socket.id} ask all other users to HOLD`);
			// }
		});

		// 5. Ask all other users to prepare to resume at a given timing
		const releaseBufferer = (buffererId, roomId) => {
			redisClient
				.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
				.then((delRes) => redisClient.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`))
				.then((delRes) => videoIO.to(socket.id).emit("RELEASE"))
				.catch((delErr) => console.log(delErr));
		};
		const addEmptyBufferEntry = (buffererId, roomId, numOfUsers) => {
			const newEntry = {
				roomId,
				readys: [],
				target: numOfUsers,
			};
			console.log(
				`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}'s entryStr: ${JSON.stringify(newEntry)}`
			);
			redisClient
				.set(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`, JSON.stringify(newEntry))
				.then((appendRes) => console.log(appendRes))
				.catch((appendErr) => console.log(appendErr));
		};
		socket.on("REQUEST_RELEASE", (roomId, newTiming) => {
			/////////////////////////////////////////////////////
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			redisClient.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`).then((exists) => {
				if (exists === 1) {
					console.log(
						`${socket.id} is already waiting for release, ignoring this release request...`
					);
				} else {
					redisClient
						.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
						.then((numOfSockets) => {
							const numOfUsers = numOfSockets - 1;

							if (numOfUsers <= 0) {
								releaseBufferer(socket.id, roomId);
							}

							console.log(
								`${socket.id} requests for ${numOfUsers} unique readys at ${newTiming}`
							);

							redisClient
								.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`)
								.then((entryExists) => {
									if (entryExists === 0) {
										addEmptyBufferEntry(socket.id, roomId, numOfUsers);
									}

									console.log(`Ask room ${roomId} to prepare release`);
									socket.to(roomId).emit("PREPARE_RELEASE", newTiming);
								});
						});
				}
			});
			/////////////////////////////////////////////////////

			// if (roomId === "") {
			// 	console.log(`Invalid room ID: ${roomId}`);
			// } else if (bufferReadysMap.has(socket.id)) {
			// 	console.log(
			// 		`${socket.id} is already waiting for release, ignoring this release request...`
			// 	);
			// } else {
			// 	const numOfUsers = roomSocketMap.get(roomId).length - 1;

			// 	if (numOfUsers == 0) {
			// 		console.log(
			// 			`There are no other users to prepare resume for, bufferer will be release immediately`
			// 		);
			// 		bufferReadysMap.delete(socket.id);
			// 		roomHoldersMap.delete(roomId);
			// 		videoIO.to(socket.id).emit("RELEASE");
			// 	}

			// 	console.log(
			// 		`${socket.id} requests for ${numOfUsers} unique readys at ${newTiming}`
			// 	);

			// 	if (!bufferReadysMap.has(socket.id)) {
			// 		bufferReadysMap.set(socket.id, {
			// 			roomId,
			// 			readys: new Set(),
			// 			target: numOfUsers,
			// 		});
			// 	}
			// 	socket.to(roomId).emit("PREPARE_RELEASE", newTiming);
			// }
		});

		// 6. Tell the server that this user is ready to resume
		socket.on("REQUEST_RELEASE_READY", async (roomId, buffererId, releaseSelfCallback) => {
			/////////////////////////////////////////////////////
			redisClient
				.exists(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
				.then(async (exists) => {
					if (exists === 0) {
						redisClient
							.exists(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
							.then((exists) => {
								if (exists === 1) {
									redisClient
										.scard(`${VIDEO_PREFIX_ROOMSOCKETS}_${roomId}`)
										.then((numOfSockets) => {
											const numOfUsers = numOfSockets - 1;
											if (numOfUsers === 1) {
												redisClient
													.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
													.then((delRes) =>
														videoIO.to(roomId).emit("RELEASE")
													)
													.catch((delErr) => console.log(delErr));
											}
										})
										.catch((scardErr) => console.log(scardErr));
								}
							})
							.catch((existsErr) => console.log(existsErr));
					} else {
						let entry, newEntry;

						const response = client
							.multi()
							.set("key", "value")
							.set("another-key", "another-value")
							.get("another-key")
							.exec((res, value) => console.log(`${res} | ${value}`)); // ['OK', 'another-value']

						client
							.multi()
							.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`, (err, entryStr) => {
								console.log(`entryStr: ${entryStr}`);
								entry = JSON.parse(entryStr);
								newEntry = { ...entry, readys: [...entry.readys, socket.id] };
							})
							.exec((getErr, getRes) => {
								if (getErr) {
									console.log("Get encounter error");
									console.log(getErr);
									return;
								}

								console.log("Entry:");
								console.log(entry);
								console.log("newEntry:");
								console.log(newEntry);

								if (newEntry.readys.length >= newEntry.target) {
									client
										.multi()
										.del(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
										.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`)
										.exec((delErr, delRes) => {
											if (!delErr) {
												console.log("Deletion success");
												socket.to(roomId).emit("RELEASE");
											} else {
												console.log("Deletion encountered error");
												console.log(delErr);
											}
											releaseSelfCallback();
										});
								} else {
									client
										.multi()
										.set(
											`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`,
											JSON.stringify(newEntry)
										)
										.exec((setErr, setRes) => {
											if (setErr) {
												console.log("set encounter error");
												console.log(setErr);
												return;
											}

											console.log("BufferRead updated with newEntry");
										});
								}
							});

						// redisClient
						// 	.get(`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`)
						// 	.then((entryStr) => {
						// 		console.log(`buffererId: ${buffererId}`);
						// 		const entry = JSON.parse(entryStr);
						// 		console.log(`entry:`);
						// 		console.log(entry);
						// 		const newEntry = { ...entry, readys: [...entry.readys, socket.id] };
						// 		console.log(`new entry:`);
						// 		console.log(newEntry);
						// 		if (newEntry.readys.length >= newEntry.target) {
						// 		const deleteBufferReady = redisClient.del(
						// 			`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`
						// 		);
						// 		const deleteRoomHolders = redisClient.del(
						// 			`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`
						// 		);
						// 		Promise.all([deleteBufferReady, deleteRoomHolders])
						// 			.then((res) => {
						// 				console.log(
						// 					`${buffererId} receive ${newEntry.readys.size} unique readys, releasing all in ${roomId}`
						// 				);
						// 				console.log(`Removing ${roomId} from holdSet`);
						// 				socket.to(roomId).emit("RELEASE");
						// 			})
						// 			.catch((err) => console.log("Delete fail"))
						// 			.finally(() => releaseSelfCallback());
						// 	} else {
						// 		console.log("NANI");
						// 		console.log(
						// 			`SET ${VIDEO_PREFIX_BUFFERREADYS}_${buffererId} => ${JSON.stringify(
						// 				newEntry
						// 			)}`
						// 		);

						// 		redisClient
						// 			.set(
						// 				`${VIDEO_PREFIX_BUFFERREADYS}_${buffererId}`,
						// 				JSON.stringify(newEntry)
						// 			)
						// 			.then((appendRes) => console.log(appendRes))
						// 			.catch((appendErr) => console.log(appendErr));
						// 	}
						// })
						// .catch((err) => console.log(err));
					}
				});
			/////////////////////////////////////////////////////

			// if (!bufferReadysMap.has(buffererId)) {
			// 	if (roomHoldersMap.has(roomId)) {
			// 		console.log(
			// 			`${socket.id}: Buffer entry for ${buffererId} not found but the buffering room exists, creating a buffer entry... (Total: 1)`
			// 		);

			// 		const numOfUsers = roomSocketMap.get(roomId).length - 1;

			// 		if (numOfUsers == 1) {
			// 			console.log(
			// 				`${buffererId} receive 1 total unique readys, releasing all users in ${roomId} by REQUEST_RELEASE_READY`
			// 			);
			// 			console.log(`Removing ${roomId} from holdSet`);
			// 			roomHoldersMap.delete(roomId);
			// 			videoIO.to(roomId).emit("RELEASE");
			// 		} else {
			// 			const readySet = new Set();
			// 			readySet.add(socket.id);
			// 			bufferReadysMap.set(buffererId, {
			// 				roomId,
			// 				readys: readySet,
			// 				target: numOfUsers,
			// 			});
			// 		}
			// 	} else {
			// 		console.log(
			// 			`Buffer entry for ${buffererId} not found and there is no room for it, ignoring this ready...`
			// 		);
			// 	}
			// } else {
			// 	const newEntry = bufferReadysMap.get(buffererId);
			// 	newEntry.readys.add(socket.id);

			// 	console.log(`${socket.id} sent a ready (Total: ${newEntry.readys.size})`);

			// 	if (newEntry.readys.size >= newEntry.target) {
			// 		console.log(
			// 			`${buffererId} receive ${newEntry.readys.size} total unique readys, releasing all users in ${roomId} REQUEST_RELEASE_ALL _ HAS BUFFER`
			// 		);
			// 		console.log(`Removing ${roomId} from holdSet`);

			// 		bufferReadysMap.delete(buffererId);
			// 		roomHoldersMap.delete(roomId);
			// 		socket.to(roomId).emit("RELEASE");
			// 		releaseSelfCallback();
			// 	} else {
			// 		bufferReadysMap.set(buffererId, newEntry);
			// 	}
			// }
		});

		// 7. Ask all other users to resume from holding
		socket.on("REQUEST_RELEASE_ALL", (roomId) => {
			/////////////////////////////////////////////////////
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
				return;
			}

			const deleteBufferReady = redisClient.del(`${VIDEO_PREFIX_BUFFERREADYS}_${socket.id}`);
			const deleteRoomHolders = redisClient.del(`${VIDEO_PREFIX_ROOMHOLDERS}_${roomId}`);
			Promise.all([deleteBufferReady, deleteRoomHolders])
				.then((res) => {
					console.log(`${socket.id} releasing all users in ${roomId} by RELEASE_ALL`);
					console.log(`Removing ${roomId} from holdSet`);
					socket.to(roomId).emit("RELEASE");
				})
				.catch((err) => console.log(err));
			/////////////////////////////////////////////////////

			// if (roomId === "") {
			// 	console.log(`Invalid room ID: ${roomId}`);
			// } else {
			// 	console.log(`${socket.id} releasing all users in ${roomId} by REQUEST_RELEASE_ALL`);
			// 	console.log(`Removing ${roomId} from holdSet`);
			// 	bufferReadysMap.delete(socket.id);
			// 	roomHoldersMap.delete(roomId);
			// 	socket.to(roomId).emit("RELEASE");
			// }
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
