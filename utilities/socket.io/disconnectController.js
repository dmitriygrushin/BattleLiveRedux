const { removeUserFromRoom, getUsersInRoom, isRapperAndIsFinished } = require('../../utilities/socket.io/db');
const { rapRoomEventLoop } = require('../../utilities/socket.io/rapEventLoopController');
const { pool } = require('../../dbConfig');
module.exports.disconnectController = (io, socket, roomId, userId) => {
    socket.on('disconnect', async () => {
        console.log('socket disconnected ' + socket.id)
        // remove the disconnected peer connection from all other connected clients
        socket.broadcast.emit('removePeer', socket.id) // send the disconnection signal to all other clients
        
        // if a rapper leaves the room before finishing then they get a loss.
        if (!(await isRapperAndIsFinished(userId, roomId))) await pool.query(`UPDATE user_stats SET loss = loss + 1 WHERE id = $1`, [userId]);

        /* --------------- UserList start --------------- */
        // remove user from room table
        await removeUserFromRoom(roomId, userId);

        // UserList - send all users in room to client in a room 
        io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));

        await rapRoomEventLoop(io, socket, roomId);

        /* --------------- UserList end --------------- */
    })
}