const express = require('express');
const {
  validateRoomId,
  validateUserId,
  validateUsername,
} = require('../utils/validation');

const createRouter = (chatStore) => {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'realtime-chat-server' });
  });

  router.get('/rooms', (req, res) => {
    res.json({ rooms: chatStore.listRooms() });
  });

  router.get('/rooms/:roomId/messages', (req, res, next) => {
    try {
      const roomId = validateRoomId(req.params.roomId);
      const messages = chatStore.getMessages(roomId, req.query.limit);
      res.json({ roomId, messages });
    } catch (error) {
      next(error);
    }
  });

  router.get('/rooms/:roomId/presence', (req, res, next) => {
    try {
      const roomId = validateRoomId(req.params.roomId);
      res.json(chatStore.getPresence(roomId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/rooms/:roomId/presence', (req, res, next) => {
    try {
      const roomId = validateRoomId(req.params.roomId);
      const userId = validateUserId(req.body.userId);
      const username = validateUsername(req.body.username);
      res.status(201).json(chatStore.addMember(roomId, { userId, username }));
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = createRouter;
