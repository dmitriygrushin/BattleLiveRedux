const listUsers = document.getElementById('user-list');
listUsers.style.display = 'none';
const listChat = document.getElementById('messages');
const chatUserListToggle = document.getElementById('flexSwitchCheckChecked');

chatUserListToggle.addEventListener('click', chatUserListToggleVisibility); // toggle div visibility
chatUserListToggle.addEventListener('click', chatUserListSwitchButton);

module.exports.userListController = (socket) => {
    socket.on('update-user-list', users => { onUpdateUserList(users) });
}

/**
 * Update user list on DOM
 * @param {Array} users
 */
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