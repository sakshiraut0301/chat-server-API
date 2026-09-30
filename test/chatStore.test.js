const test = require('node:test');
const assert = require('node:assert/strict');
const ChatStore = require('../src/store/chatStore');

test('stores bounded message history and tracks presence', () => {
  const store = new ChatStore({ historyLimit: 2 });
  store.addMember('general', { userId: 'u1', username: 'Ada' });
  store.addMessage('general', { userId: 'u1', username: 'Ada', text: 'one' });
  store.addMessage('general', { userId: 'u1', username: 'Ada', text: 'two' });
  store.addMessage('general', { userId: 'u1', username: 'Ada', text: 'three' });

  assert.deepEqual(store.getMessages('general').map((message) => message.text), ['two', 'three']);
  assert.equal(store.getPresence('general').count, 1);
  assert.equal(store.removeMember('general', 'u1').count, 0);
});
