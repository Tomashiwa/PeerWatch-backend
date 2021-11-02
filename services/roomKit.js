const { redisClient } = require("./redis");

const ROOM_PREFIX_SOCKETUSER = "ROOM_SOCKETUSER";
const ROOM_PREFIX_USERROOM = "ROOM_USERROOM";
const ROOM_PREFIX_ROOMUSERS = "ROOM_ROOMUSERS";

module.exports = (io) => {
	const roomIO = io.of("/chat");

	roomIO.on("connection", (socket) => {
		console.log(`${socket.id} connected to roomIO`);

		// Upon client sending message.
		socket.on("send-message", (msg, roomId) => {
			console.log(`Message received: ${msg}`);
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("receive-message", msg);
				console.log(`Message sent to room ${roomId}`);
			}
		});

		socket.on("SEND_KICK", (roomId, userId) => {
			console.log(`kicking ${userId} from room ${roomId}`);
			socket.to(roomId).emit("RECEIVE_KICK", userId);
		});

		socket.on("SEND_ROOM_SETTINGS", (roomId, capacity, settings) => {
			console.log(`${socket.id} change ${roomId}'s capacity to ${capacity}`);
			socket.to(roomId).emit("RECEIVE_ROOM_SETTINGS", capacity, settings);
		});

		// join the client to the room "number" received.
		socket.on("join-room", async (roomId, userId, callback) => {
			console.log(`${socket.id} has joined the room ${roomId}`);
			socket.join(roomId);

			// Update mapping
			const appendSocketUser = redisClient.append(
				`${ROOM_PREFIX_SOCKETUSER}_${socket.id}`,
				userId
			);
			const appendUserRoom = redisClient.append(`${ROOM_PREFIX_USERROOM}_${userId}`, roomId);
			Promise.all([appendSocketUser, appendUserRoom])
				.then((results) => console.log(results))
				.catch((err) => console.log(err));

			// Emit new user list
			const key = `${ROOM_PREFIX_ROOMUSERS}_${roomId}`;
			const existsRoomUsers = redisClient.exists(key);
			const membersRoomUsers = redisClient.smembers(key);
			const addRoomUsers = redisClient.sadd(key, userId);
			let newUsers;
			existsRoomUsers
				.then((existsRes) => {
					membersRoomUsers
						.then((users) => {
							newUsers = users.map((user) => parseInt(user));
							newUsers.push(userId);
							return addRoomUsers;
						})
						.then((addRes) => {
							roomIO.in(roomId).emit("update-user-list", newUsers, newUsers[0]);
							callback();
						});
				})
				.catch((existsErr) => {
					addRoomUsers.then((addRes) => {
						roomIO.in(roomId).emit("update-user-list", [userId], userId);
						callback();
					});
				});
		});

		socket.on("disconnect", async function () {
			const userRes = await redisClient.get(`${ROOM_PREFIX_SOCKETUSER}_${socket.id}`);
			if (!userRes) {
				console.log("userRes not found");
				return;
			}
			const userId = parseInt(userRes);

			const roomId = await redisClient.get(`${ROOM_PREFIX_USERROOM}_${userId}`);
			if (!roomId) {
				console.log("roomId not found");
				return;
			}

			const users = await redisClient.smembers(`${ROOM_PREFIX_ROOMUSERS}_${roomId}`);
			if (!users) {
				console.log("users not found");
				return;
			}

			let newUsers = users;
			for (let i = 0; i < newUsers.length; i++) {
				if (newUsers[i] === userId) {
					newUsers.splice(i, 1);
				}
			}

			const deleteSocketUser = redisClient.del(`${ROOM_PREFIX_SOCKETUSER}_${socket.id}`);
			const deleteUserRoom = redisClient.del(`${ROOM_PREFIX_USERROOM}_${userId}`);
			Promise.all([deleteSocketUser, deleteUserRoom])
				.then(async (res) => {
					const removeRes = await redisClient.srem(
						`${ROOM_PREFIX_ROOMUSERS}_${roomId}`,
						userId
					);
					if (!removeRes) {
						console.log("remove from set failed");
						return;
					}
					socket.to(roomId).emit("update-user-list", newUsers, newUsers[0]);
				})
				.catch((err) => {
					console.log(err);
				});
		});
	});
};
