const addUserToQueueButton = document.getElementById('addUserToQueue');
const timer = document.getElementById('timer');
const voteButton = document.getElementById('voteButton');
const rapper1VoteButton = document.getElementById('rapper1VoteButton');
const rapper2VoteButton = document.getElementById('rapper2VoteButton');
const cancelVoteButton = document.getElementById('cancelVoteButton');

document.getElementById('voted-p').style.visibility = 'hidden';
voteButton.disabled = true;

module.exports.rapEventLoopController = (socket, peers, localStream, constraints) => {

    console.log(`------rapEventLoopController---------`);
    console.log(`constraints.video : ${constraints.video}`);
    console.log(`constraints.audio : ${constraints.audio}`);
    console.log(`------rapEventLoopController---------`);

    addUserToQueueButton.addEventListener('click', addUserToQueue);
    rapper1VoteButton.addEventListener('click', voteButtonClick);
    rapper2VoteButton.addEventListener('click', voteButtonClick);

    socket.on('display-stream', socket_id => {
        document.getElementById(socket_id).style.display = 'block';
    });

    socket.on('give-stream-permission', () => {
        giveStreamPermission();
    });

    socket.on('winner-voted', winner => {
        document.getElementById('winnerHeading').innerHTML = `Winner: ${winner}`;
        // exit the user out of the voting modal once winner has been decided
        voteButton.disabled = true;
        cancelVoteButton.click();
    })

    socket.on('rapper-vs-rapper', rappers => {
        document.getElementById('rapper-vs-rapper').innerHTML = rappers;
    });

    socket.on('vote-setup', (rapper1, rapper2) => {
        rapper1VoteButton.value = rapper1.id;
        rapper1VoteButton.innerHTML = rapper1.username;

        rapper2VoteButton.value = rapper2.id;
        rapper2VoteButton.innerHTML = rapper2.username;
    });

    socket.on('vote-rapper', () => {
        voteButton.disabled = false;
        voteButton.click();
    });

    /**
     * After rappers are refreshed refresh the voting buttons got get ready for next rappers
     */
    socket.on('refresh-votes', () => {
        voteButton.disabled = true;
        rapper1VoteButton.disabled = false;
        rapper2VoteButton.disabled = false;
        document.getElementById('voted-p').style.visibility = 'hidden';
        rapper1VoteButton.className = 'btn btn-info'
        rapper2VoteButton.className = 'btn btn-info'
    });

    socket.on('timer', (timerType, seconds) => {
        if (timerType == 'Pending') {
            timer.innerHTML = `Timer: [${timerType}]`;
        } else {
            timer.innerHTML = `Timer: [${timerType}: ${seconds}]`;
        }
    });

    // allow both rappers to talk after they're done (enable mics of both rappers)
    socket.on('rappers-finished', socket_id => {
        /*
        const videos = document.getElementsByTagName('video');
        for (let i = 0; i < videos.length; i++) {
            videos[i].classList.remove('selected-rapper');
        }
        */

        if (socket.id == socket_id) {
            const myVideo = document.getElementById('localVideo');
            myVideo.classList.add('finished-rapper');
            toggleMute(true); // if it's the client's turn then their mic will turn ON
        } 
        const video = document.getElementById(socket_id).getElementsByTagName('video')[0];

        if (typeof(video) != 'undefined' && video != null) {
            video.classList.add('finished-rapper');
        }
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
            toggleMute(true); // if it's the client's turn then their mic will turn ON
        } else {
            const video = document.getElementById(socket_id).getElementsByTagName('video')[0];
            video.classList.add('selected-rapper');
            toggleMute(false); // if it's NOT the client's turn then their mic will turn OFF
        }
    });

    socket.on('refresh-rapper', () => {
        //window.location.href = "https://www.google.com/";
        window.location.reload();
    });

    function addUserToQueue() {
        socket.emit('add-user-to-queue', roomId, userId);
        addUserToQueueButton.disabled = true;
    }	

    function voteButtonClick(e) {
        //console.log(e.target.innerHTML);
        rapper1VoteButton.disabled = true;
        rapper2VoteButton.disabled = true;
        rapper1VoteButton.className = 'btn btn-secondary'
        rapper2VoteButton.className = 'btn btn-secondary'
        e.target.className = 'btn btn-success';
        document.getElementById('voted-p').style.visibility = 'visible';

        // send rapper id
        socket.emit('vote-rapper', e.target.value);
    }

    /**
     * Turns on stream track
     * @param {boolean} isOn - true to turn on, false to turn off
     */
    function streamOn(isOn) {
        if (constraints.video && constraints.audio) {
            for (let socket_id in peers) {
                for (let index in peers[socket_id].streams[0].getTracks()) {
                    // disable all tracks
                    peers[socket_id].streams[0].getTracks()[index].enabled = isOn; 
                }
            }
        }

        // for good measure - webRTC is unpredictable
        /*
        */
       
        console.log(`constraints.video : ${constraints.video}`);
        console.log(`constraints.audio : ${constraints.audio}`);
        if (constraints.video) {
            console.log(`constraints.video: ${constraints.video}`)
            for (let index in localStream.getVideoTracks()) {
                localStream.getVideoTracks()[index].enabled = isOn;
            }
        }
 
        if (constraints.audio) {
            for (let index in localStream.getAudioTracks()) {
                localStream.getAudioTracks()[index].enabled = false; // audio is false until it's the client's turn to rap
            }
        }


        const vidButton = document.getElementById('vidButton');
        const muteButton = document.getElementById('muteButton');
        vidButton.disabled = false;
        muteButton.disabled = false;

        updateButtons(); // update buttons after client stream comes on
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

    /**
     * updating text of buttons depending on the state of video/audio
     */
    function updateButtons() {
        if (constraints.video) {
            for (let index in localStream.getVideoTracks()) {
                document.getElementById('vidButton').innerText = localStream.getVideoTracks()[index].enabled ? "✔ Video Enabled" : "❌ Video Disabled"
                document.getElementById('vidButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : " btn btn-success";
            }
        }
        if (constraints.audio) {
            for (let index in localStream.getAudioTracks()) {
                document.getElementById('muteButton').innerText = localStream.getAudioTracks()[index].enabled ? "✔ Unmuted" : "❌ Muted"
                document.getElementById('muteButton').className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
            }
        }
    }

    function toggleMute(isOn) {
        if (constraints.audio) {
            for (let index in localStream.getAudioTracks()) {
                localStream.getAudioTracks()[index].enabled = isOn;
                muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
                muteButton.className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success"
            }
            updateButtons(); 
        }
    }
}
