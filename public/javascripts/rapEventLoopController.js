const addUserToQueueButton = document.getElementById('addUserToQueue');
const timer = document.getElementById('timer');


module.exports.rapEventLoopController = (socket, peers, localStream) => {
    addUserToQueueButton.addEventListener('click', addUserToQueue);

    socket.on('display-stream', socket_id => {
        document.getElementById(socket_id).style.display = 'block';
    });

    socket.on('give-stream-permission', () => {
        giveStreamPermission();
    });

    socket.on('timer', (timerType, seconds) => {
        timer.innerHTML = `Timer: [${timerType}: ${seconds}]`;
    });

    socket.on('selected-rapper', socket_id => {
        const videos = document.getElementsByTagName('video');
        for (let i = 0; i < videos.length; i++) {
            videos[i].classList.remove('selected-rapper');
        }

        /**
         *  if socket current client then highlight their camera else highlight other clients client's camera
         */ 
        if (socket.id == socket_id) {
            const myVideo = document.getElementById('localVideo');
            myVideo.classList.add('selected-rapper');
        } else {
            const video = document.getElementById(socket_id).getElementsByTagName('video')[0];
            video.classList.add('selected-rapper');
        }
    });

    socket.on('refresh-rapper' ,() => {
        window.location.reload(); 
    });

    function addUserToQueue() {
        socket.emit('add-user-to-queue', roomId, userId);
        addUserToQueueButton.disabled = true;
    }	

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
        videoDiv.style.display = 'block'; 
        streamOn(true); // enable stream
        socket.emit('display-stream'); // send request to server to turn on stream for all users
    }
}
