# Real-Time Chat Server API

A beginner-friendly, modular backend API for real-time chat using **Node.js**, **Express.js**, **Socket.io**, and **MongoDB**.

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Get all users
- Create, join, leave, and list chat rooms
- Send one-to-one and room messages
- Fetch message history for private chats and rooms
- Real-time messaging with Socket.io
- User online/offline presence
- Typing indicators
- Input validation and centralized error handling
- CORS enabled for frontend integration

## Technologies Used

- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- JSON Web Token (JWT)
- bcryptjs
- express-validator
- dotenv
- cors
- express-rate-limit

## Project Structure

```text
chat-server-API/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   ├── roomController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateRequest.js
│   ├── models/
│   │   ├── Message.js
│   │   ├── Room.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── roomRoutes.js
│   │   └── userRoutes.js
│   ├── socket/
│   │   └── socket.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/chat_server_api
JWT_SECRET=your_jwt_secret
```

## Run the Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

## REST API Endpoints

Base URL: `http://localhost:5000`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users` (Protected)

### Rooms

- `GET /api/rooms` (Protected)
- `POST /api/rooms` (Protected)
- `POST /api/rooms/join/:roomId` (Protected)
- `POST /api/rooms/leave/:roomId` (Protected)

### Messages

- `GET /api/messages/history?roomId=<roomId>` (Protected)
- `GET /api/messages/history?userId=<userId>` (Protected)
- `POST /api/messages/send` (Protected)

---

## Example Requests and Responses

### Register User

**POST** `/api/auth/register`

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

**Response**

```json
{
  "message": "User registered successfully",
  "token": "<jwt_token>",
  "user": {
    "id": "66f0f6e2d4b3b2b8c2a91e11",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

### Login

**POST** `/api/auth/login`

```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

### Create Room

**POST** `/api/rooms`

Headers:

```text
Authorization: ******
```

Body:

```json
{
  "name": "General"
}
```

### Send Private Message

**POST** `/api/messages/send`

```json
{
  "receiverId": "66f0f6e2d4b3b2b8c2a91e22",
  "content": "Hi there!"
}
```

### Send Room Message

**POST** `/api/messages/send`

```json
{
  "roomId": "66f0f6e2d4b3b2b8c2a91e33",
  "content": "Welcome everyone"
}
```

---

## Socket.io Events

Authenticate socket connection by sending token in handshake:

```js
const socket = io('http://localhost:5000', {
  auth: { token: '<jwt_token>' }
});
```

### Client -> Server

- `join_room` -> payload: `roomId`
- `leave_room` -> payload: `roomId`
- `typing` -> payload: `{ roomId?, receiverId?, isTyping }`
- `private_message` -> payload: `{ receiverId, content }`
- `room_message` -> payload: `{ roomId, content }`

### Server -> Client

- `user_online` -> `{ userId }`
- `user_offline` -> `{ userId }`
- `room_joined` -> `{ roomId, userId }`
- `room_left` -> `{ roomId, userId }`
- `typing` -> typing updates for room or private chat
- `private_message` -> saved private message object
- `room_message` -> saved room message object

---

## Notes

- All messages are stored with timestamps (`createdAt`, `updatedAt`) via Mongoose.
- Protected REST APIs require an Authorization header containing a valid JWT.
- API routes use basic rate limiting for safer production defaults.
