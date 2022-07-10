const { addUserToQueue, makeRapper, isInQueueAndNotRapper } = require('./db');
module.exports.rapEventLoopController = async (io, socket, roomId) => {
    socket.on('add-user-to-queue', async (roomId, userId) => { await addUserToQueue(roomId, userId) });

    // update user in user_connected table to is_rapper to true if they are in_queue
    socket.on('become-rapper', async (roomId, userId) => {
        if (await isInQueueAndNotRapper(roomId, userId) == true) {
            await makeRapper(roomId, userId);
            io.to(socket.id).emit('give-stream-permission') // give stream permission to user
        }
    });

    socket.on('give-broadcast-permission', () => {
        // signal all users to allow the stream to be displayed
        socket.broadcast.to(roomId).emit('give-broadcast-permission', socket.id); 
    });
}