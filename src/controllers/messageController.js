const mongoose = require('mongoose');
const Message = require('../models/Message');
const Room = require('../models/Room');

const getMessageHistory = async (req, res, next) => {
  try {
    const { roomId, userId } = req.query;

    if (!roomId && !userId) {
      return res.status(400).json({ message: 'roomId or userId query parameter is required' });
    }

    let messages = [];

    if (roomId) {
      messages = await Message.find({ room: roomId })
        .populate('sender', 'name email')
        .populate('room', 'name')
        .sort({ createdAt: 1 });
    } else {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId' });
      }

      messages = await Message.find({
        room: null,
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id }
        ]
      })
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .sort({ createdAt: 1 });
    }

    return res.status(200).json(messages);
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, receiverId, roomId } = req.body;

    if (!receiverId && !roomId) {
      return res.status(400).json({ message: 'receiverId or roomId is required' });
    }

    if (receiverId && roomId) {
      return res.status(400).json({ message: 'Provide either receiverId or roomId, not both' });
    }

    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      if (!room.members.some((member) => member.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'You must join the room before sending messages' });
      }
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId || null,
      room: roomId || null,
      content
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('room', 'name');

    return res.status(201).json(populatedMessage);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMessageHistory, sendMessage };
