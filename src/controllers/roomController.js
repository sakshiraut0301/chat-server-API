const Room = require('../models/Room');

const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    return res.status(200).json(rooms);
  } catch (error) {
    return next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;

    const room = await Room.create({
      name,
      createdBy: req.user._id,
      members: [req.user._id]
    });

    return res.status(201).json(room);
  } catch (error) {
    return next(error);
  }
};

const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.members.some((member) => member.toString() === req.user._id.toString())) {
      room.members.push(req.user._id);
      await room.save();
    }

    return res.status(200).json({ message: 'Joined room successfully', room });
  } catch (error) {
    return next(error);
  }
};

const leaveRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.members = room.members.filter((member) => member.toString() !== req.user._id.toString());
    await room.save();

    return res.status(200).json({ message: 'Left room successfully', room });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getRooms, createRoom, joinRoom, leaveRoom };
