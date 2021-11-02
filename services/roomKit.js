const { redisClient } = require("./redis");

const socketUserPrefix = "SOCKETUSER";
const userRoomPrefix = "USERROOM";
const roomUsersPrefix = "ROOMUSERS";

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
			const appendSocketUser = redisClient.append(`${socketUserPrefix}_${socket.id}`, userId);
			const appendUserRoom = redisClient.append(`${userRoomPrefix}_${userId}`, roomId);
			Promise.all([appendSocketUser, appendUserRoom])
				.then((results) => console.log(results))
				.catch((err) => console.log(err));

			// Emit new user list
			const key = `${roomUsersPrefix}_${roomId}`;
			const existsRoomUsers = redisClient.exists(key);
			const membersRoomUsers = redisClient.smembers(key);
			const addRoomUsers = redisClient.sadd(key, userId);
			let newUsers;
			existsRoomUsers
				.then((existsRes) => {
					membersRoomUsers
						.then((users) => {
							newUsers = users;
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
			const userRes = await redisClient.get(`${socketUserPrefix}_${socket.id}`);
			if (!userRes) {
				console.log("userRes not found");
				return;
			}
			const userId = parseInt(userRes);

			const roomId = await redisClient.get(`${userRoomPrefix}_${userId}`);
			if (!roomId) {
				console.log("roomId not found");
				return;
			}

			const users = await redisClient.smembers(`${roomUsersPrefix}_${roomId}`);
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

			const deleteSocketUser = redisClient.del(`${socketUserPrefix}_${socket.id}`);
			const deleteUserRoom = redisClient.del(`${userRoomPrefix}_${userId}`);
			Promise.all([deleteSocketUser, deleteUserRoom])
				.then(async (res) => {
					const removeRes = await redisClient.srem(
						`${roomUsersPrefix}_${roomId}`,
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
