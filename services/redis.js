const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { promisify } = require("util");

const pubClient = createClient({ host: "localhost", port: 6379 });
const subClient = pubClient.duplicate();
const client = pubClient.duplicate();

const exists = promisify(client.exists).bind(client);

// Strings
const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);

// Sets
const sadd = promisify(client.sadd).bind(client);
const scard = promisify(client.scard).bind(client);
const srem = promisify(client.srem).bind(client);
const sismember = promisify(client.sismember).bind(client);
const smembers = promisify(client.smembers).bind(client);

// Hashed objects
const hget = promisify(client.hget).bind(client);
const hgetall = promisify(client.hgetall).bind(client);
const hset = promisify(client.hset).bind(client);
const hmset = promisify(client.hmset).bind(client);

const multi = (commands) => {
	const clientMulti = client.multi(commands);
	return promisify(clientMulti.exec).call(clientMulti);
};

const adapter = createAdapter(pubClient, subClient);

module.exports = {
	adapter,
	client,
	redisClient: {
		exists,
		set,
		get,
		del,
		sadd,
		scard,
		srem,
		sismember,
		smembers,
		hget,
		hgetall,
		hset,
		hmset,
		multi,
	},
};
