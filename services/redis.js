const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();
const redisClient = pubClient.duplicate();

const adapter = createAdapter(pubClient, subClient);

module.exports = {
	adapter,
	redisClient,
};
