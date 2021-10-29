const retrieveUserLists = () => {
	//some way to retrieve current user list from DB?
};

const socketUserMap = new Map();
// Mapping a user to the room it is in
const userRoomMap = new Map();
// Mapping a room to all the users in the room
const roomUsersMap = new Map();

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
		socket.on("join-room", (roomId, userId, callback) => {
			console.log(`${socket.id} has joined the room ${roomId}`);
			socket.join(roomId);

			// Update mapping
			socketUserMap.set(socket.id, userId);
			userRoomMap.set(userId, roomId); // To-do. change to multiple rooms ?

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

		socket.on("disconnect", function () {
			if (
				!socketUserMap.has(socket.id) ||
				!userRoomMap.has(socketUserMap.get(socket.id)) ||
				!roomUsersMap.has(userRoomMap.get(socketUserMap.get(socket.id)))
			) {
				return;
			}
			const userId = socketUserMap.get(socket.id);
			const roomId = userRoomMap.get(userId);

			let newUserList = roomUsersMap.get(roomId);
			for (let i = 0; i < newUserList.length; i++) {
				if (newUserList[i] === userId) {
					newUserList.splice(i, 1);
				}
			}

			socketUserMap.delete(socket.id);
			roomUsersMap.set(roomId, newUserList);
			socket.to(roomId).emit("update-user-list", newUserList, newUserList[0]);
		});
	});
};
