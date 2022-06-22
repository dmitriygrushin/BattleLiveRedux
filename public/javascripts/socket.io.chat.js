const socket = io();

const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const scrollDiv = document.getElementById('scroll-div');

// join room and send room id to server
socket.emit('join-room', roomId);

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        let message = `${username}: ${input.value}`;
        socket.emit('chat-message', message);
        input.value = '';
    }
});

// send message to server
socket.on('chat-message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    scrollDiv.scrollTo(0, document.body.scrollHeight); // make the chat scroll to the bottom
});
