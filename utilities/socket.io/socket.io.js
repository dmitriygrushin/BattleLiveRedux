const { addUserToRoom, removeUserFromRoom, getUsersInRoom} = require('../../utilities/socket.io/db');

module.exports.socketIo = async (io) => {
    io.on('connection', (socket) => {
        socket.on('join-room', async (roomId, user_id) => {
            socket.join(roomId);

            // add user to room table when user joins room 
            await addUserToRoom(roomId, user_id);

            // send all users in room to client in a room 
            io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));

            /**
             * webRTC
             */
            // emit 'initReceive' to all clients in the room except the current client 
            // Asking all other clients to setup the peer connection receiver
            socket.broadcast.to(roomId).emit('initReceive', socket.id);

            /**
             * webRTC
             */
            // relay a peerconnection signal to a specific user in a room (socket.io rooms) 
            socket.on('signal', data => {
                console.log('sending signal from ' + socket.id + ' to ', data)
                io.to(data.socket_id).emit('signal', {
                    socket_id: socket.id,
                    signal: data.signal
                });
            });


            socket.on('chat-message', msg => {
                io.to(roomId).emit('chat-message', msg);
            });

            socket.on('disconnect', async () => {
                // remove user from room table
                await removeUserFromRoom(roomId, user_id);

                /**
                 * webRTC
                 */
                socket.broadcast.emit('removePeer', socket.id) // send the disconnection signal to all other clients

                // send all users in room to client in a room 
                io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));
            });

            
            /**
             * webRTC
             */
           /* Send message to client to initiate a connection,
            The sender has already setup a peer connection receiver */
           socket.on('initSend', init_socket_id => {
                console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
                io.to(init_socket_id).emit('initSend', socket.id) // send the socket id to the receiver
            });
        });
    });
}