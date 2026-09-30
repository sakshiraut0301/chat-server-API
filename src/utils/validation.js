const cleanString = (value, field, { max = 100 } = {}) => {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.statusCode = 400;
    throw error;
  }
  const result = value.trim();
  if (result.length > max) {
    const error = new Error(`${field} must be ${max} characters or fewer`);
    error.statusCode = 400;
    throw error;
  }
  return result;
};

const validateRoomId = (value) => cleanString(value, 'roomId', { max: 80 });
const validateUserId = (value) => cleanString(value, 'userId', { max: 80 });
const validateUsername = (value) => cleanString(value, 'username', { max: 80 });
const validateMessage = (value) => cleanString(value, 'text', { max: 2000 });

module.exports = {
  cleanString,
  validateRoomId,
  validateUserId,
  validateUsername,
  validateMessage,
};
