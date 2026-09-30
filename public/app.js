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
  apiLog: document.querySelector('#api-log'),
  clearApiLog: document.querySelector('#clear-api-log'),
};

socket.on('connect', () => {
  setStatus(true);
  logApi('SOCKET', 'connect', {}, { socketId: socket.id });
});
socket.on('disconnect', (reason) => {
  setStatus(false);
  logApi('SOCKET', 'disconnect', {}, { reason });
});

socket.on('room:history', ({ roomId, messages }) => {
  logApi('RESPONSE', 'room:history', { roomId }, { messageCount: messages.length, messages });
  elements.messages.replaceChildren();
  if (!messages.length) showEmptyState();
  messages.forEach(renderMessage);
});

socket.on('message:new', (message) => {
  logApi('RESPONSE', 'message:new', { roomId: message.roomId }, message);
  removeEmptyState();
  renderMessage(message);
});

socket.on('presence:update', (presence) => {
  logApi('RESPONSE', 'presence:update', { roomId: presence.roomId }, presence);
  renderPresence(presence);
});

socket.on('chat:error', ({ message }) => {
  logApi('ERROR', 'chat:error', {}, { message });
  elements.joinError.textContent = message;
});

elements.joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.username = elements.username.value.trim();
  state.roomId = elements.room.value.trim();
  elements.joinError.textContent = '';

  const payload = {
    roomId: state.roomId,
    userId: state.userId,
    username: state.username,
  };
  logApi('REQUEST', 'room:join', payload);
  socket.emit('room:join', payload, (result) => {
    logApi(result.ok ? 'RESPONSE' : 'ERROR', 'room:join callback', payload, result);
    if (!result.ok) {
      elements.joinError.textContent = result.error;
      return;
    }
    elements.roomName.textContent = state.roomId;
    elements.joinPanel.classList.add('hidden');
    elements.chatPanel.classList.remove('hidden');
    elements.messageInput.focus();
    loadPresenceViaApi();
  });
});

elements.messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = elements.messageInput.value.trim();
  if (!text) return;
  const payload = { text };
  logApi('REQUEST', 'message:send', payload);
  socket.emit('message:send', payload, (result) => {
    logApi(result.ok ? 'RESPONSE' : 'ERROR', 'message:send callback', payload, result);
    if (result.ok) elements.messageInput.value = '';
  });
});

elements.leaveButton.addEventListener('click', () => {
  logApi('REQUEST', 'room:leave', { roomId: state.roomId });
  socket.emit('room:leave');
  elements.chatPanel.classList.add('hidden');
  elements.joinPanel.classList.remove('hidden');
  elements.messages.replaceChildren();
  showEmptyState();
});

elements.clearApiLog.addEventListener('click', () => {
  elements.apiLog.replaceChildren();
  logApi('SYSTEM', 'log cleared', {}, {});
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

async function loadPresenceViaApi() {
  const endpoint = `/api/rooms/${encodeURIComponent(state.roomId)}/presence`;
  logApi('REST REQUEST', `GET ${endpoint}`, {});
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    logApi(response.ok ? 'REST RESPONSE' : 'REST ERROR', `GET ${endpoint}`, {}, data);
    if (response.ok) renderPresence(data);
  } catch (error) {
    logApi('REST ERROR', `GET ${endpoint}`, {}, { message: error.message });
  }
}

function logApi(type, name, request, response = null) {
  const entry = document.createElement('article');
  entry.className = 'api-entry';

  const top = document.createElement('div');
  top.className = 'api-entry-top';
  const label = document.createElement('span');
  label.textContent = `${type}  ${name}`;
  const time = document.createElement('span');
  time.className = 'api-entry-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  top.append(label, time);

  const details = document.createElement('pre');
  details.textContent = `request: ${JSON.stringify(request, null, 2)}${response === null ? '' : `\nresponse: ${JSON.stringify(response, null, 2)}`}`;
  entry.append(top, details);
  elements.apiLog.prepend(entry);

  while (elements.apiLog.children.length > 50) {
    elements.apiLog.lastElementChild.remove();
  }
}

showEmptyState();
