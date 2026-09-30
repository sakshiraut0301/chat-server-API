const {
  validateRoomId,
  validateUserId,
  validateUsername,
  validateMessage,
} = require('../utils/validation');

const emitError = (socket, error) => {
  socket.emit('chat:error', { message: error.message, statusCode: error.statusCode || 500 });
};

const createChatSocket = (io, chatStore) => {
  io.on('connection', (socket) => {
    socket.on('room:join', (payload = {}, callback = () => {}) => {
      try {
        const roomId = validateRoomId(payload.roomId);
        const userId = validateUserId(payload.userId);
        const username = validateUsername(payload.username);

        if (socket.data.roomId && socket.data.roomId !== roomId) {
          leaveRoom(socket, io, chatStore);
        }
        socket.data.user = { userId, username };
        socket.data.roomId = roomId;
        socket.join(roomId);

        const presence = chatStore.addMember(roomId, { userId, username });
        socket.emit('room:history', {
          roomId,
          messages: chatStore.getMessages(roomId),
        });
        io.to(roomId).emit('presence:update', presence);
        callback({ ok: true, roomId, presence });
      } catch (error) {
        emitError(socket, error);
        callback({ ok: false, error: error.message });
      }
    });

    socket.on('message:send', (payload = {}, callback = () => {}) => {
      try {
        if (!socket.data.roomId || !socket.data.user) {
          throw Object.assign(new Error('Join a room before sending messages'), { statusCode: 400 });
        }
        const text = validateMessage(payload.text);
        const message = chatStore.addMessage(socket.data.roomId, {
          ...socket.data.user,
          text,
        });
        io.to(socket.data.roomId).emit('message:new', message);
        callback({ ok: true, message });
      } catch (error) {
        emitError(socket, error);
        callback({ ok: false, error: error.message });
      }
    });

    socket.on('room:leave', () => {
      leaveRoom(socket, io, chatStore);
    });

    socket.on('disconnect', () => {
      leaveRoom(socket, io, chatStore);
    });
  });
};

function leaveRoom(socket, io, chatStore) {
  const { roomId, user } = socket.data;
  if (!roomId || !user) return;
  socket.leave(roomId);
  const presence = chatStore.removeMember(roomId, user.userId);
  socket.data.roomId = undefined;
  if (presence) io.to(roomId).emit('presence:update', presence);
}

module.exports = createChatSocket;
