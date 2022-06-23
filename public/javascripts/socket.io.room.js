const socket = io();

const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');

const scrollDiv = document.getElementById('scroll-div-chat');
const listChat = document.getElementById('messages');
const listUsers = document.getElementById('user-list');
listUsers.style.display = 'none';

const chatUserListToggle = document.getElementById('flexSwitchCheckChecked');

socket.emit('join-room', roomId, userId);

// get list of users in room
socket.on('update-user-list', users => {
    // clear ul list
    listUsers.querySelectorAll('*').forEach(n => {n.remove()});

    // add users to list
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        listUsers.appendChild(li);
    });
});

// toggle div visibility
chatUserListToggle.addEventListener('click', () => {
    if (chatUserListToggle.checked) {
        listChat.style.display = 'block';
        listUsers.style.display = 'none';

    } else {
        listChat.style.display = 'none';
        listUsers.style.display = 'block';
    }
}
);

chatUserListToggle.addEventListener('click', () => {
    const chatUserListText = document.getElementById('chatUserListText');
    chatUserListText.innerHTML = (chatUserListToggle.checked) ? 'Chat' : 'User List';
});

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
