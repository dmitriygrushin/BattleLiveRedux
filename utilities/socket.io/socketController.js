const { webRtcController } = require('../../utilities/socket.io/webRtcController');
const { userListController } = require('../../utilities/socket.io/userListController');
const { rapperQueueController } = require('../../utilities/socket.io/rapperQueueController');
const { disconnectController } = require('../../utilities/socket.io/disconnectController');

module.exports = async (io) => {
    io.on('connect', (socket) => {
        socket.on('join-room', async (roomId, userId) => {
            console.log('a client is connected')
            socket.join(roomId); 

            userListController(io, socket, roomId, userId);

            webRtcController(io, socket, roomId); // setup initial WebRTC connection

            rapperQueueController(io, socket);

            socket.on('chat-message', msg => { io.to(roomId).emit('chat-message', msg) });

            disconnectController(io, socket, roomId, userId);
        });
    })
}