module.exports.webRtcController = (io, socket, roomId) => {
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

    socket.on('give-broadcast-permission', () => {
        // signal all users to allow the stream to be displayed
        socket.broadcast.to(roomId).emit('give-broadcast-permission', socket.id); 
    });
}