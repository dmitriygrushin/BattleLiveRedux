const addUserToQueueButton = document.getElementById('addUserToQueue');
const becomeRapperButton = document.getElementById('becomeRapper');
const timer = document.getElementById('timer');


module.exports.rapEventLoopController = (socket, peers, localStream) => {
    addUserToQueueButton.addEventListener('click', addUserToQueue);
    becomeRapperButton.addEventListener('click', () => {
        console.log('becomeRapperButton clicked');
    });

    socket.on('display-stream', socket_id => {
        document.getElementById(socket_id).style.display = 'block';
    });

    socket.on('give-stream-permission', () => {
        giveStreamPermission();
    });

    socket.on('timer', (timerType, seconds) => {
        timer.innerHTML = `Timer: [${timerType}: ${seconds}]`;
    });

    function addUserToQueue() {
        socket.emit('add-user-to-queue', roomId, userId);
        addUserToQueueButton.disabled = true;
    }	

    /*
    function becomeRapper() {
        socket.emit('become-rapper', roomId, userId);
    }
    */

    /**
     * Turns on stream track
     * @param {boolean} isOn - true to turn on, false to turn off
     */
    function streamOn(isOn) {
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                // disable all tracks
                peers[socket_id].streams[0].getTracks()[index].enabled = isOn; 
            }
        }
        // TODO: sync button text with whether or not the stream audio/video is on or off.
        // for good measure - webRTC is unpredictable
        for (let index in localStream.getVideoTracks()) {
            localStream.getVideoTracks()[index].enabled = isOn;
            localStream.getAudioTracks()[index].enabled = isOn;
        }
    }

    /**
     * Turns on stream track and 
     * sends signal to server to tell all other users to turn on this user's stream
     */
    function giveStreamPermission() {
        localVideo.style.display = 'block'; 
        streamOn(true); // enable stream
        socket.emit('display-stream'); // send request to server to turn on stream for all users
    }
}
