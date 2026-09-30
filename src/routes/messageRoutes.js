const express = require('express');
const { body, query } = require('express-validator');
const { getMessageHistory, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get(
  '/history',
  protect,
  [
    query('roomId').optional().isMongoId().withMessage('Invalid roomId'),
    query('userId').optional().isMongoId().withMessage('Invalid userId')
  ],
  validateRequest,
  getMessageHistory
);

router.post(
  '/send',
  protect,
  [
    body('content').trim().notEmpty().withMessage('Message content is required'),
    body('receiverId').optional().isMongoId().withMessage('Invalid receiverId'),
    body('roomId').optional().isMongoId().withMessage('Invalid roomId')
  ],
  validateRequest,
  sendMessage
);

module.exports = router;
