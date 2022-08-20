const { webRtcController } = require('../../utilities/socket.io/webRtcController');
const { userListController } = require('../../utilities/socket.io/userListController');
const { rapEventLoopController } = require('../../utilities/socket.io/rapEventLoopController');
const { disconnectController } = require('../../utilities/socket.io/disconnectController');

module.exports = async (io) => {
    io.on('connect', (socket) => {
        socket.on('join-room', async (roomId, userId, username) => {
            console.log('a client is connected')
            socket.join(roomId); 

            userListController(io, socket, roomId, userId);

            webRtcController(io, socket, roomId, username); // setup initial WebRTC connection

            rapEventLoopController(io, socket, roomId);

            socket.on('chat-message', msg => { io.to(roomId).emit('chat-message', msg) });

            disconnectController(io, socket, roomId, userId);
        });
    })
}