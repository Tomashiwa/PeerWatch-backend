const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { promisify } = require("util");

const pubClient = createClient({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();
const client = pubClient.duplicate();

const exists = promisify(client.exists).bind(client);

// Strings
const append = promisify(client.append).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);

// Sets
const sadd = promisify(client.sadd).bind(client);
const scard = promisify(client.scard).bind(client);
const srem = promisify(client.srem).bind(client);
const sismember = promisify(client.sismember).bind(client);
const smembers = promisify(client.smembers).bind(client);

const adapter = createAdapter(pubClient, subClient);

module.exports = {
	adapter,
	redisClient: {
		exists,
		append,
		get,
		del,
		sadd,
		scard,
		srem,
		sismember,
		smembers,
	},
};
