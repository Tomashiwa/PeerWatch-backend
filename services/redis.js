const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { promisify } = require("util");

const pubClient = createClient({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();
const client = pubClient.duplicate();

const append = promisify(client.append).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);

const adapter = createAdapter(pubClient, subClient);

module.exports = {
	adapter,
	redisClient: {
		append,
		get,
		del,
	},
};
