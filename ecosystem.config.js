module.exports = {
    apps: [
      {
        name: 'peerwatch-server',
        script: 'npm run server',
        interpreter: 'none',
        env: {
          NODE_ENV: 'development',
        },
      },
      {
        name: 'peerwatch-client',
        script: 'npm run client-build',
        interpreter: 'none',
        env: {
          NODE_ENV: 'development',
        },
      },
    ],
  }