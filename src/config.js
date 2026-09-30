const numberFromEnv = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

module.exports = {
  port: numberFromEnv(process.env.PORT, 3000),
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  messageHistoryLimit: Math.max(
    1,
    numberFromEnv(process.env.MESSAGE_HISTORY_LIMIT, 100),
  ),
};
