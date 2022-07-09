const { removeUserFromRoom, getUsersInRoom, } = require('../../utilities/socket.io/db');
module.exports.disconnectController = (io, socket, roomId, userId) => {
    socket.on('disconnect', async () => {
        console.log('socket disconnected ' + socket.id)
        // remove the disconnected peer connection from all other connected clients
        socket.broadcast.emit('removePeer', socket.id) // send the disconnection signal to all other clients

        /* --------------- UserList start --------------- */
        // remove user from room table
        await removeUserFromRoom(roomId, userId);

        // UserList - send all users in room to client in a room 
        io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));
        /* --------------- UserList end --------------- */
    })
}