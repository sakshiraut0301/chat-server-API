const http = require('node:http');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require('./config');
const ChatStore = require('./store/chatStore');
const createRouter = require('./http/routes');
const createChatSocket = require('./socket/chatSocket');

const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.clientOrigin, methods: ['GET', 'POST'] },
  });
  const chatStore = new ChatStore({ historyLimit: config.messageHistoryLimit });

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/api', createRouter(chatStore));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
  });

  createChatSocket(io, chatStore);
  return { app, server, io, chatStore };
};

module.exports = createApp;
