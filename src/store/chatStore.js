const crypto = require('node:crypto');

class ChatStore {
  constructor({ historyLimit = 100 } = {}) {
    this.historyLimit = historyLimit;
    this.rooms = new Map();
  }

  ensureRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        messages: [],
        members: new Map(),
      });
    }
    return this.rooms.get(roomId);
  }

  addMember(roomId, user) {
    const room = this.ensureRoom(roomId);
    room.members.set(user.userId, { ...user });
    return this.getPresence(roomId);
  }

  removeMember(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.members.delete(userId);
    const presence = this.getPresence(roomId);
    if (room.members.size === 0 && room.messages.length === 0) {
      this.rooms.delete(roomId);
    }
    return presence;
  }

  getPresence(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { roomId, count: 0, users: [] };
    return {
      roomId,
      count: room.members.size,
      users: [...room.members.values()],
    };
  }

  addMessage(roomId, { userId, username, text }) {
    const room = this.ensureRoom(roomId);
    const message = {
      id: crypto.randomUUID(),
      roomId,
      userId,
      username,
      text,
      createdAt: new Date().toISOString(),
    };
    room.messages.push(message);
    if (room.messages.length > this.historyLimit) {
      room.messages.splice(0, room.messages.length - this.historyLimit);
    }
    return message;
  }

  getMessages(roomId, limit = this.historyLimit) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || this.historyLimit, this.historyLimit));
    return room.messages.slice(-safeLimit);
  }

  listRooms() {
    return [...this.rooms.values()].map((room) => ({
      id: room.id,
      memberCount: room.members.size,
      messageCount: room.messages.length,
    }));
  }
}

module.exports = ChatStore;
