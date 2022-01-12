module.exports = {
	apps: [
		{
			name: "peerwatch-server",
			script: "npm run server",
			interpreter: "none",
			env: {
				NODE_ENV: "production",
			},
		},
	],
};
