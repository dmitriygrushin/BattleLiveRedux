const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const scrollDiv = document.getElementById('scroll-div-chat');

module.exports.chatController = (socket) => {
    form.addEventListener('submit', onChatFormSubmit);
    socket.on('chat-message', msg => { onChatMessage(msg) }); // send message to server

    /**
     * Send message to server 
     */
    function onChatFormSubmit(e) {
        e.preventDefault();
        if (input.value) {
            let message = `${username}: ${input.value}`;
            socket.emit('chat-message', message);
            input.value = '';
        }
    }

    /**
     * Add message to DOM when received from server 
     * @param {String} msg 
     */
    function onChatMessage(msg) {
        const item = document.createElement('li');
        item.textContent = msg;
        messages.appendChild(item);
        scrollDiv.scrollTo(0, document.body.scrollHeight); // make the chat scroll to the bottom
    }
}
