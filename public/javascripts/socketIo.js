let socket;
let localStream = null;
let peers = {};

// redirect if not https
if(location.href.substr(0,5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4)

    /** ============================== 
     *          Chat Start 
     * ============================== */
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const scrollDiv = document.getElementById('scroll-div-chat');
const listChat = document.getElementById('messages');
const listUsers = document.getElementById('user-list');
listUsers.style.display = 'none';
const chatUserListToggle = document.getElementById('flexSwitchCheckChecked');
    /* =============== Chat end =============== */

    /** ============================== 
     *          Rapper Queue Start 
     * ============================== */
const addRapperToQueueButton = document.getElementById('addRapperToQueue');
    /* =============== Rapper Queue end =============== */


    /** ============================== 
     *          WebRTC Start 
     * ============================== */
/**
 * RTCPeerConnection configuration 
 */
const configuration = {
    // Using From https://www.metered.ca/tools/openrelay/
    "iceServers": [
    {
      urls: "stun:openrelay.metered.ca:80"
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
}

/**
 * UserMedia constraints
 */
let constraints = {
    audio: true,
    video: true
}

constraints.video.facingMode = { ideal: "user" };

// enabling the camera at startup
navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    console.log('Received local stream');

    localVideo.srcObject = stream;
    localStream = stream;

    init();

}).catch(e => alert(`getUserMedia error ${e.name}`))
    /* =============== WebRTC end =============== */

/**
 * initialize the socket connections
 */
function init() {
    socket = io();

    socket.emit('join-room', roomId, userId);

    // get list of users in room
    socket.on('update-user-list', users => { onUpdateUserList(users) });

    /* --------------- WebRTC start --------------- */
    socket.on('initReceive', socket_id => {
        console.log('INIT RECEIVE ' + socket_id);
        addPeer(socket_id, false);
        socket.emit('initSend', socket_id);
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id);
        addPeer(socket_id, true);
    })

    socket.on('removePeer', socket_id => {
        console.log('removing peer ' + socket_id);
        removePeer(socket_id);
    })

    socket.on('disconnect', () => {
        console.log('GOT DISCONNECTED');
        for (let socket_id in peers) {
            removePeer(socket_id);
        }
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal);
    })
    /* --------------- WebRTC end --------------- */

    /* --------------- Chat start --------------- */
    chatUserListToggle.addEventListener('click', chatUserListToggleVisibility); // toggle div visibility
    chatUserListToggle.addEventListener('click', chatUserListSwitchButton);
    form.addEventListener('submit', onChatFormSubmit);
    socket.on('chat-message', msg => { onChatMessage(msg) }); // send message to server
    /* --------------- Chat end --------------- */

    /* --------------- Rapper Queue start --------------- */
    addRapperToQueueButton.addEventListener('click', addRapperToQueue);
    /* --------------- Rapper Queue end --------------- */

}

    /** ============================== 
     *          Rapper Queue Start 
     * ============================== */
function addRapperToQueue() {
    socket.emit('add-rapper-to-queue', roomId, userId);
    addRapperToQueueButton.disabled = true;
}
    /* =============== Rapper Queue end =============== */

    /** ============================== 
     *          Chat Start 
     * ============================== */
/**
 * Update user list on DOM
 * @param {Array} users
 */
function onUpdateUserList(users) {
    // clear ul list
    listUsers.querySelectorAll('*').forEach(n => {n.remove()});

    // add users to list
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        listUsers.appendChild(li);
    });
}

function chatUserListToggleVisibility() {
    if (chatUserListToggle.checked) {
        listChat.style.display = 'block';
        listUsers.style.display = 'none';

    } else {
        listChat.style.display = 'none';
        listUsers.style.display = 'block';
    }
}

function chatUserListSwitchButton() {
    const chatUserListText = document.getElementById('chatUserListText');
    chatUserListText.innerHTML = (chatUserListToggle.checked) ? 'Chat' : 'User List';
}


/**
 * Send message to server 
 */
function onChatFormSubmit(e) {
    e.preventDefault();
    if (input.value) {
        let message = `${username}: ${input.value}`;
        socket.emit('chat-message', message);
        input.value = '';
    }
}

/**
 * Add message to DOM when received from server 
 * @param {String} msg 
 */
function onChatMessage(msg) {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    scrollDiv.scrollTo(0, document.body.scrollHeight); // make the chat scroll to the bottom
}
    /* =============== Chat end =============== */


    /** ============================== 
     *          WebRTC Start 
     * ============================== */
/**
 * Remove a peer with given socket_id. 
 * Removes the video element and deletes the connection
 * @param {String} socket_id 
 */
function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id);
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop();
        })

        videoEl.srcObject = null;
        videoEl.parentNode.removeChild(videoEl);
    }
    if (peers[socket_id]) peers[socket_id].destroy();
    delete peers[socket_id];
}

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id 
 *                 ID of the peer
 * @param {Boolean} isInitiator 
 *                  Set to true if the peer initiates the connection process.
 *                  Set to false if the peer receives the connection. 
 */
function addPeer(socket_id, isInitiator) {
    peers[socket_id] = new SimplePeer({
        initiator: isInitiator,
        stream: localStream,
        config: configuration
    });

    peers[socket_id].on('signal', data => {
        socket.emit('signal', {
            signal: data,
            socket_id: socket_id
        });
    });

    // append stream to video element
    peers[socket_id].on('stream', stream => {
        let newVid = document.createElement('video');
        newVid.srcObject = stream;
        newVid.id = socket_id;
        newVid.playsinline = false;
        newVid.autoplay = true;
        newVid.className = "vid";
        newVid.onclick = () => openPictureMode(newVid);
        newVid.ontouchstart = (e) => openPictureMode(newVid);
        videos.appendChild(newVid);
    });
}

/**
 * Opens an element in Picture-in-Picture mode
 * @param {HTMLVideoElement} el video element to put in pip mode
 */
function openPictureMode(el) {
    console.log('opening pip');
    el.requestPictureInPicture();
}

/**
 * Enable/disable video
 */
function toggleVid() {
    for (let index in localStream.getVideoTracks()) {
        localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled;
        vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled";
        vidButton.className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
    }
}
    /* =============== WebRTC end =============== */

/**
 * Enable/disable microphone
 */
function toggleMute() {
    for (let index in localStream.getAudioTracks()) {
        localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
        muteButton.className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success"
    }
}

