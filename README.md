<<<<<<< HEAD
# Real-time chat server

Backend API for a real-time chat application using Express and Socket.io.

## Run it

```bash
npm install
copy .env.example .env
npm run dev
```

The server starts at `http://localhost:3000` by default. Configure `PORT`,
`CLIENT_ORIGIN`, and `MESSAGE_HISTORY_LIMIT` in `.env`.

## REST API

All REST routes are prefixed with `/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/rooms` | List active rooms |
| GET | `/api/rooms/:roomId/messages?limit=50` | Read recent messages |
| GET | `/api/rooms/:roomId/presence` | Read users currently in a room |
| POST | `/api/rooms/:roomId/presence` | Add/update a user in presence |

Example request:

```json
POST /api/rooms/general/presence
{
  "userId": "user-1",
  "username": "Ada"
}
```

## Socket.io API

Connect to the server, then emit:

### `room:join`

```js
socket.emit('room:join', {
  roomId: 'general',
  userId: 'user-1',
  username: 'Ada'
}, (result) => console.log(result));
```

The server sends `room:history` to the joining socket and
`presence:update` to everyone in the room.

### `message:send`

```js
socket.emit('message:send', { text: 'Hello!' }, (result) => {
  console.log(result);
});
```

Every room member receives `message:new` with:

```json
{
  "id": "generated-message-id",
  "roomId": "general",
  "userId": "user-1",
  "username": "Ada",
  "text": "Hello!",
  "createdAt": "2026-09-30T00:00:00.000Z"
}
```

### `room:leave`

Emit `room:leave` when the user leaves intentionally. Disconnecting also
removes the user and broadcasts the updated `presence:update` event.

Errors are sent as `chat:error` and also returned through event callbacks as
`{ ok: false, error: "..." }`.

## Project structure

```text
src/
  app.js                 Express + Socket.io composition
  server.js              Production entry point
  config.js              Environment configuration
  http/routes.js         REST endpoints
  socket/chatSocket.js   Socket.io event handlers
  store/chatStore.js     In-memory rooms, presence, and history
  utils/validation.js    Shared input validation
test/chatStore.test.js   Store unit test
```

The current store is intentionally in-memory, so data is lost when the server
restarts and multiple server instances will not share presence. For production,
replace `ChatStore` with a database-backed message repository and use a Redis
adapter for Socket.io presence/event synchronization.

## Basic frontend

The browser UI is served by the same server. Start the backend and open
`http://localhost:3000`. The frontend files are in `public/` and use the same
Socket.io events documented above.
=======
# chat-server-API
Real-time chat server API using Node.js, Express.js &amp; Socket.io.
>>>>>>> 829480c073400b5f37f88b469d488faf332e539e
