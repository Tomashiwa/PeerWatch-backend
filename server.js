const express = require("express");
const app = express();

const users = require("./routes/api/users");

app.use(express.json());
app.use("/api/users", users);

const server = app.listen("5000", () => {
	console.log("Server started on port 5000...");
});

const io = require("socket.io")(server, {
	cors: "http://localhost:3000",
});

// Add events, middlewares and other addons to the socket
require("./services/ioKit")(io);
