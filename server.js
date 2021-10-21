const ping = require("./routes/api/ping");
const express = require("express");
const app = express();
const { instrument } = require("@socket.io/admin-ui");
const path = require("path");

const users = require("./routes/api/users");
const rooms = require("./routes/api/rooms");
const auth = require("./routes/api/auth");
const { Server } = require("socket.io");

app.use(express.json());
app.get("/api/ping", ping);
app.use("/api/users", users);
app.use("/api/rooms", rooms);
app.use("/api/auth", auth);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
	app.use(express.static("client/build"));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
	});
}

const server = app.listen("5000", () => {
	console.log("Server started on port 5000...");
});

const io = new Server(server, {
	cors: {
		origin: ["http://localhost:3000", "https://admin.socket.io/", "http://54.179.111.98:3000/"],
		credentials: false,
	},
});

// Add events, middlewares and other addons to the socket
require("./services/roomKit")(io);
require("./services/videoKit")(io);

// Admin tool for socket.io
instrument(io, { auth: false, namespaceName: "/" });
