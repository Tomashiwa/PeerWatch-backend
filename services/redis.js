const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const host = process.env.NODE_ENV === "production" ? "54.179.111.98" : "localhost";
const pubClient = createClient({ host, port: 6379 });
const subClient = pubClient.duplicate();
const redisClient = pubClient.duplicate();

const adapter = createAdapter(pubClient, subClient);

module.exports = {
	adapter,
	redisClient,
};
