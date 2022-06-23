const { addUserToRoom, removeUserFromRoom, getUsersInRoom} = require('../../utilities/socket.io/db');

module.exports.socketIo = async (io) => {
    io.on('connection', (socket) => {
        socket.on('join-room', async (roomId, user_id) => {
            socket.join(roomId);

            // add user to room table when user joins room 
            await addUserToRoom(roomId, user_id);

            // send all users in room to client in a room 
            io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));

            socket.on('chat-message', msg => {
                io.to(roomId).emit('chat-message', msg);
            });

            socket.on('disconnect', async () => {
                // remove user from room table
                await removeUserFromRoom(roomId, user_id);

                // send all users in room to client in a room 
                io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));
            });
        });
    });
}