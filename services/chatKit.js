const retrieveUserLists = () => {
	//some way to retrieve current user list from DB?
}

// Mapping a socket to the room it is in
const socketRoomMap = new Map();
// Mapping a room to all the sockets in the room
const roomSocketMap = new Map();

module.exports = (io) => {
	const chatIO = io.of("/chat");
	
	chatIO.on("connection", (socket) => {
		// Might have better way of doing this
		let userRoomId;
		console.log(`${socket.id} connected to chatIO`);

		// Upon client sending message.
		socket.on("send-message", (msg, roomId) => {
			console.log(`Message received: ${msg}`);
			// If no room. Should not happen. Should prevent this from happening.
			if (roomId === "") {
				console.log(`Invalid room ID: ${roomId}`);
			} else {
				socket.to(roomId).emit("receive-message", msg);
				console.log(`Message sent to room ${roomId}`);
			}
		});

		// join the client to the room "number" received.
		socket.on("join-room", (roomId, callback) => {
			console.log(`${socket.id} has joined the room ${roomId}`);
			socket.join(roomId);
			
			// Update mapping
			socketRoomMap.set(socket.id, roomId);
			let userList;
			if (roomSocketMap.has(roomId)) {
				userList = roomSocketMap.get(roomId);
				userList.push({ id: socket.id, name: `${socket.id}`, isHost: userList.length == 0 });
				roomSocketMap.set(roomId, userList);
			} else {
				roomSocketMap.set(roomId, [{ id: socket.id, name: `${socket.id}`, isHost: true }]);
				userList = roomSocketMap.get(roomId);
			}

			socket.to(roomId).emit("update-user-list", userList);
			socket.emit("update-user-list", userList);
			callback();
		});
		
		socket.on('disconnect', function(){
			if (socketRoomMap.has(socket.id) && roomSocketMap.has(socketRoomMap.get(socket.id))) {
				const roomId = socketRoomMap.get(socket.id);
				socket.to(roomId).emit("receive-message", `${socket.id} has left the chat`);
				
				let userList = roomSocketMap.get(roomId);
				// might have better way. Find or idk man.
				for (var i = 0; i < userList.length; i++) {
					if (userList[i].name == `${socket.id}`) {
						userList.splice(i, 1);
					}
				}
				
				if (userList.length > 0) {
					userList[0].isHost = true;
				}
				
				roomSocketMap.set(roomId, userList);
				socket.to(roomId).emit("update-user-list", userList);
			}
		});
	});
};
