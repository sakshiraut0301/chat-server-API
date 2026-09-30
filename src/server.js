const config = require('./config');
const createApp = require('./app');

const { server } = createApp();

server.listen(config.port, () => {
  console.log(`Real-time chat server listening on http://localhost:${config.port}`);
});
