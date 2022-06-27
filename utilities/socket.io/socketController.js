const { addUserToRoom, removeUserFromRoom, getUsersInRoom} = require('../../utilities/socket.io/db');

module.exports = async (io) => {
    io.on('connect', (socket) => {
        socket.on('join-room', async (roomId, userId) => {
            console.log('a client is connected')
            socket.join(roomId); 

                /* --------------- UserList start --------------- */
            // add user to room table when user joins room 
            await addUserToRoom(roomId, userId);
                /* --------------- UserList end --------------- */

            // send all users in room to client in a room 
            io.to(roomId).emit('update-user-list', await getUsersInRoom(roomId));
                /* --------------- UserList end --------------- */

                /* --------------- WebRTC start --------------- */
            // emit 'initReceive' to all clients in the room except the current client 
            // Asking all other clients to setup the peer connection receiver
            socket.broadcast.to(roomId).emit('initReceive', socket.id);
            
            // relay a peer connection signal to a specific user in a room (socket.io rooms) 
            socket.on('signal', data => {
                console.log('sending signal from ' + socket.id + ' to ', data)
                io.to(data.socket_id).emit('signal', {
                    socket_id: socket.id,
                    signal: data.signal
                });
            });

            /* Send message to client to initiate a connection,
            The sender has already setup a peer connection receiver */
            socket.on('initSend', init_socket_id => {
                console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
                io.to(init_socket_id).emit('initSend', socket.id) // send the socket id to the receiver
            });
                /* --------------- WebRTC end --------------- */

                /* --------------- Chat start --------------- */
            socket.on('chat-message', msg => {
                io.to(roomId).emit('chat-message', msg);
            });
                /* --------------- Chat end --------------- */

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
        });
    })
}