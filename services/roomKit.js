const { redisClient } = require("./redis");

// Mapping a room to all the users in the room
const roomUsersMap = new Map();

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

			let newList;
			if (roomUsersMap.has(roomId)) {
				newList = roomUsersMap.get(roomId);
				newList.push(userId);
				roomUsersMap.set(roomId, newList);
				roomIO.in(roomId).emit("update-user-list", newList, newList[0]);
			} else {
				newList = [userId];
				roomUsersMap.set(roomId, newList);
				roomIO.in(roomId).emit("update-user-list", newList, userId);
			}

			callback();
		});

		socket.on("disconnect", async function () {
			const userId = parseInt(await redisClient.get(`${socketUserPrefix}_${socket.id}`));
			if (!userId) {
				console.log("userId not found");
				return;
			}

			const roomId = await redisClient.get(`${userRoomPrefix}_${userId}`);
			if (!roomId || !roomUsersMap.has(roomId)) {
				console.log("roomId not found");
				return;
			}

			let newUserList = roomUsersMap.get(roomId);
			for (let i = 0; i < newUserList.length; i++) {
				if (newUserList[i] === userId) {
					newUserList.splice(i, 1);
				}
			}

			redisClient
				.del(`${socketUserPrefix}_${socket.id}`)
				.then((res) => console.log(res))
				.catch((err) => console.log(err));
			redisClient
				.del(`${userRoomPrefix}_${userId}`)
				.then((res) => console.log(res))
				.catch((err) => console.log(err));
			roomUsersMap.set(roomId, newUserList);
			socket.to(roomId).emit("update-user-list", newUserList, newUserList[0]);
		});
	});
};
