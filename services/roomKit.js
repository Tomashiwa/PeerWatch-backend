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
			const appendSocketUser = redisClient.set(
				`${ROOM_PREFIX_SOCKETUSER}_${socket.id}`,
				userId
			);
			const appendUserRoom = redisClient.set(`${ROOM_PREFIX_USERROOM}_${userId}`, roomId);
			Promise.all([appendSocketUser, appendUserRoom])
				.then((results) => console.log(results))
				.catch((err) => console.log(err));

			// Emit new user list
			const key = `${ROOM_PREFIX_ROOMUSERS}_${roomId}`;
			try {
				await redisClient.exists(key);
				const users = await redisClient.lrange(key, 0, -1);
				const newUsers = users.map((user) => parseInt(user));
				newUsers.push(userId);

				await redisClient.rpush(key, userId);
				roomIO.in(roomId).emit("update-user-list", newUsers, newUsers[0]);
				callback();
			} catch (err) {
				await redisClient.rpush(key, userId);
				roomIO.in(roomId).emit("update-user-list", [userId], userId);
				callback();
			}
		});

		socket.on("disconnect", async function () {
			const userId = await redisClient.get(`${ROOM_PREFIX_SOCKETUSER}_${socket.id}`);
			if (!userId) {
				console.log("userId not found");
				return;
			}

			const roomId = await redisClient.get(`${ROOM_PREFIX_USERROOM}_${userId}`);
			if (!roomId) {
				console.log("roomId not found");
				return;
			}

			const users = await redisClient.lrange(`${ROOM_PREFIX_ROOMUSERS}_${roomId}`, 0, -1);
			if (!users) {
				console.log("users not found");
				return;
			}

			let newUsers = users.filter((user) => user !== userId).map((user) => parseInt(user));

			const deleteSocketUser = redisClient.del(`${ROOM_PREFIX_SOCKETUSER}_${socket.id}`);
			const deleteUserRoom = redisClient.del(`${ROOM_PREFIX_USERROOM}_${userId}`);
			Promise.all([deleteSocketUser, deleteUserRoom])
				.then(async () => {
					console.log("deletion sucess");
					const removeRes = await redisClient.lrem(
						`${ROOM_PREFIX_ROOMUSERS}_${roomId}`,
						0,
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
