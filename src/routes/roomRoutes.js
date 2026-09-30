const express = require('express');
const { body, param } = require('express-validator');
const { getRooms, createRoom, joinRoom, leaveRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', protect, getRooms);

router.post(
  '/',
  protect,
  [body('name').trim().notEmpty().withMessage('Room name is required')],
  validateRequest,
  createRoom
);

router.post('/join/:roomId', protect, [param('roomId').isMongoId().withMessage('Invalid roomId')], validateRequest, joinRoom);
router.post('/leave/:roomId', protect, [param('roomId').isMongoId().withMessage('Invalid roomId')], validateRequest, leaveRoom);

module.exports = router;
