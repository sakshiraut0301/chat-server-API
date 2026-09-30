const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Room = require('../models/Room');

const onlineUsers = new Map();

const getTokenFromSocket = (socket) => {
  const authToken = socket.handshake.auth && socket.handshake.auth.token;
  if (authToken) {
    return authToken;
  }

  const queryToken = socket.handshake.query && socket.handshake.query.token;
  return queryToken;
};

const registerSocketServer = (io) => {
  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket);

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      return next();
    } catch (error) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(userId);

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);
    io.emit('user_online', { userId });

    socket.on('join_room', async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('socket_error', { message: 'Room not found' });
          return;
        }

        if (!room.members.some((member) => member.toString() === userId)) {
          room.members.push(userId);
          await room.save();
        }

        socket.join(roomId);
        io.to(roomId).emit('room_joined', { roomId, userId });
      } catch (error) {
        socket.emit('socket_error', { message: 'Unable to join room' });
      }
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit('room_left', { roomId, userId });
    });

    socket.on('typing', ({ roomId, receiverId, isTyping }) => {
      if (roomId) {
        socket.to(roomId).emit('typing', { roomId, userId, isTyping });
      } else if (receiverId) {
        socket.to(receiverId).emit('typing', { userId, receiverId, isTyping });
      }
    });

    socket.on('private_message', async ({ receiverId, content }) => {
      try {
        if (!receiverId || !content) {
          return;
        }

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email')
          .populate('receiver', 'name email');

        io.to(receiverId).emit('private_message', populatedMessage);
        socket.emit('private_message', populatedMessage);
      } catch (error) {
        socket.emit('socket_error', { message: 'Unable to send private message' });
      }
    });

    socket.on('room_message', async ({ roomId, content }) => {
      try {
        if (!roomId || !content) {
          return;
        }

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('socket_error', { message: 'Room not found' });
          return;
        }

        if (!room.members.some((member) => member.toString() === userId)) {
          socket.emit('socket_error', { message: 'Join room before sending messages' });
          return;
        }

        const message = await Message.create({
          sender: userId,
          room: roomId,
          content
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name email')
          .populate('room', 'name');

        io.to(roomId).emit('room_message', populatedMessage);
      } catch (error) {
        socket.emit('socket_error', { message: 'Unable to send room message' });
      }
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
    });
  });
};

module.exports = registerSocketServer;
