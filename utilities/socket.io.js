module.exports.socketIo = async (io) => {
    io.on('connection', (socket) => {
        socket.on('join-room', (roomId) => {
            socket.join(roomId);

            socket.on('chat-message', msg => {
                io.to(roomId).emit('chat-message', msg);
            });
        });
    });
}