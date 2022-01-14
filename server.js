const express = require("express");
const app = express();
const cors = require("cors");
const { instrument } = require("@socket.io/admin-ui");
const compression = require("compression");

const ping = require("./routes/api/ping");
const rooms = require("./routes/api/rooms");
const auth = require("./routes/api/auth");

const { Server } = require("socket.io");
const { LOCAL_FRONTEND_URL, SOCKETIO_URL, PROD_FRONTEND_URL } = require("./config");
const { adapter } = require("./services/redis");

app.use(express.json());
app.use(cors());
app.use(compression());
app.get("/api/ping", ping);
app.use("/api/rooms", rooms);
app.use("/api/auth", auth);

const port = process.env.PORT || "8080";
const server = app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});

const io = new Server(server, {
	cors: {
		origin: [LOCAL_FRONTEND_URL, SOCKETIO_URL, PROD_FRONTEND_URL],
		credentials: false,
	},
});

io.adapter(adapter);

// Add events, middlewares and other addons to the socket
require("./services/roomKit")(io);
require("./services/videoKit")(io);

// Admin tool for socket.io
instrument(io, { auth: false, namespaceName: "/" });

module.exports = app;
