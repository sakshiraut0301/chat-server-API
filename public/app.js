const socket = io();

const state = {
  userId: window.crypto?.randomUUID?.() || `user-${Date.now()}`,
  username: '',
  roomId: '',
};

const elements = {
  joinPanel: document.querySelector('#join-panel'),
  chatPanel: document.querySelector('#chat-panel'),
  joinForm: document.querySelector('#join-form'),
  messageForm: document.querySelector('#message-form'),
  username: document.querySelector('#username'),
  room: document.querySelector('#room'),
  roomName: document.querySelector('#room-name'),
  messageInput: document.querySelector('#message-input'),
  messages: document.querySelector('#messages'),
  members: document.querySelector('#members'),
  memberCount: document.querySelector('#member-count'),
  status: document.querySelector('#connection-status'),
  joinError: document.querySelector('#join-error'),
  leaveButton: document.querySelector('#leave-button'),
};

socket.on('connect', () => setStatus(true));
socket.on('disconnect', () => setStatus(false));

socket.on('room:history', ({ messages }) => {
  elements.messages.replaceChildren();
  if (!messages.length) showEmptyState();
  messages.forEach(renderMessage);
});

socket.on('message:new', (message) => {
  removeEmptyState();
  renderMessage(message);
});

socket.on('presence:update', renderPresence);

socket.on('chat:error', ({ message }) => {
  elements.joinError.textContent = message;
});

elements.joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.username = elements.username.value.trim();
  state.roomId = elements.room.value.trim();
  elements.joinError.textContent = '';

  socket.emit('room:join', {
    roomId: state.roomId,
    userId: state.userId,
    username: state.username,
  }, (result) => {
    if (!result.ok) {
      elements.joinError.textContent = result.error;
      return;
    }
    elements.roomName.textContent = state.roomId;
    elements.joinPanel.classList.add('hidden');
    elements.chatPanel.classList.remove('hidden');
    elements.messageInput.focus();
  });
});

elements.messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = elements.messageInput.value.trim();
  if (!text) return;
  socket.emit('message:send', { text }, (result) => {
    if (result.ok) elements.messageInput.value = '';
  });
});

elements.leaveButton.addEventListener('click', () => {
  socket.emit('room:leave');
  elements.chatPanel.classList.add('hidden');
  elements.joinPanel.classList.remove('hidden');
  elements.messages.replaceChildren();
  showEmptyState();
});

function setStatus(isOnline) {
  elements.status.textContent = isOnline ? 'Connected' : 'Offline';
  elements.status.className = `status ${isOnline ? 'online' : 'offline'}`;
}

function renderMessage(message) {
  const wrapper = document.createElement('article');
  wrapper.className = `message ${message.userId === state.userId ? 'mine' : ''}`;

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = `${message.username} · ${formatTime(message.createdAt)}`;

  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = message.text;

  wrapper.append(meta, text);
  elements.messages.appendChild(wrapper);
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function renderPresence({ users, count }) {
  elements.memberCount.textContent = count;
  elements.members.replaceChildren();
  users.forEach((user) => {
    const item = document.createElement('li');
    item.className = 'member';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = user.username.charAt(0).toUpperCase();
    const name = document.createElement('span');
    name.textContent = user.username;
    item.append(avatar, name);
    elements.members.appendChild(item);
  });
}

function showEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty';
  empty.id = 'empty-state';
  empty.textContent = 'No messages yet. Start the conversation.';
  elements.messages.appendChild(empty);
}

function removeEmptyState() {
  document.querySelector('#empty-state')?.remove();
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

showEmptyState();
