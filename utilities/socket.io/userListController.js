const { addUserToRoom, getUsersInRoom, getRappersInRoom, } = require('../../utilities/socket.io/db');
module.exports.userListController = async (io, socket, roomId, userId) => {
    // add user to room table when user joins room 
    await addUserToRoom(roomId, userId, socket.id);

    // send all users in room to client in a room 
    io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));

}