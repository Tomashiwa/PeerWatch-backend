const express = require("express");
const app = express();
const { instrument } = require("@socket.io/admin-ui");

const users = require("./routes/api/users");
const { Server } = require("socket.io");

app.use(express.json());
app.use("/api/users", users);

const server = app.listen("5000", () => {
	console.log("Server started on port 5000...");
});

const io = new Server(server, {
	cors: {
		origin: ["http://localhost:3000", "https://admin.socket.io/"],
		credentials: false,
	},
});

// Add events, middlewares and other addons to the socket
require("./services/roomKit")(io);
require("./services/videoKit")(io);

// Admin tool for socket.io
instrument(io, { auth: false, namespaceName: "/" });
