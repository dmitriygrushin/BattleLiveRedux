let socket; //= io();
let localStream = null;
let peers = {};

const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');

const scrollDiv = document.getElementById('scroll-div-chat');
const listChat = document.getElementById('messages');
const listUsers = document.getElementById('user-list');
listUsers.style.display = 'none';

const chatUserListToggle = document.getElementById('flexSwitchCheckChecked');

init();


/**
 * initialize socket connections
 */
function init() {
    socket = io();

    socket.emit('join-room', roomId, userId);

    // get list of users in room
    socket.on('update-user-list', users => { onUpdateUserList(users) });

    
    /**
     * Chat
     */
    chatUserListToggle.addEventListener('click', chatUserListToggleVisibility); // toggle div visibility
    chatUserListToggle.addEventListener('click', chatUserListSwitchButton);
    form.addEventListener('submit', onChatFormSubmit);
    // send message to server
    socket.on('chat-message', msg => { onChatMessage(msg) });
}

function onUpdateUserList(users) {
    // clear ul list
    listUsers.querySelectorAll('*').forEach(n => {n.remove()});

    // add users to list
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        listUsers.appendChild(li);
    });
}

function chatUserListToggleVisibility() {
    if (chatUserListToggle.checked) {
        listChat.style.display = 'block';
        listUsers.style.display = 'none';

    } else {
        listChat.style.display = 'none';
        listUsers.style.display = 'block';
    }
}

function chatUserListSwitchButton() {
    const chatUserListText = document.getElementById('chatUserListText');
    chatUserListText.innerHTML = (chatUserListToggle.checked) ? 'Chat' : 'User List';
}

function onChatFormSubmit(e) {
    e.preventDefault();
    if (input.value) {
        let message = `${username}: ${input.value}`;
        socket.emit('chat-message', message);
        input.value = '';
    }
}
 
function onChatMessage(msg) {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    scrollDiv.scrollTo(0, document.body.scrollHeight); // make the chat scroll to the bottom
}
