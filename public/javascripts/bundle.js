(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const scrollDiv = document.getElementById('scroll-div-chat');

module.exports.chatController = (socket) => {
    form.addEventListener('submit', onChatFormSubmit);
    socket.on('chat-message', msg => { onChatMessage(msg) }); // send message to server

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
}

},{}],2:[function(require,module,exports){
const { chatController } = require("./chatController");
const { userListController } = require("./userListController");
const { webRtcController } = require("./webRtcController");

/*
    TODO: Working on making a user a rapper. Last thing done was emit('become-rapper')
    essentially: 
    1. user joins queue. 
    2. clicks become rapper 
    3. the server should allow the user to user their cam. 
    4. Users joining after should also see the rapper's cam

    Things such as the getTwoRappers function will be implemented for the event-loop (user story)
    and will be called by the server
*/
let socket;
let localStream = null;
let peers = {};

console.log("peers is a: " + typeof peers);

// redirect if not https
if(location.href.substr(0,5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4)

    /** ============================== 
     *          Stream Buttons Start 
     * ============================== */
    const vidButton = document.getElementById('vidButton');
    vidButton.addEventListener('click', toggleVid)

    const muteButton = document.getElementById('muteButton');
    muteButton.addEventListener('click', toggleMute);

    /* =============== Stream Buttons end =============== */

    /** ============================== 
     *          Rapper Queue Start 
     * ============================== */
const addUserToQueueButton = document.getElementById('addUserToQueue');
const becomeRapperButton = document.getElementById('becomeRapper');
    /* =============== Rapper Queue end =============== */


    /** ============================== 
     *          WebRTC Start 
     * ============================== */
/**
 * RTCPeerConnection configuration 
 */
// const configuration = {
/**
 * UserMedia constraints
 */
let constraints = {
    audio: true,
    video: true
}

constraints.video.facingMode = { ideal: "user" };

localVideo.style.display = 'none'; // remove visibility of local stream element at the beginning
// enabling the camera at startup
navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    console.log('Received local stream');

    localVideo.srcObject = stream;
    localStream = stream;

    streamOn(false); // disable all users local streams at the beginning

    init();

}).catch(e => alert(`getUserMedia error ${e.name}`))
    /* =============== WebRTC end =============== */

/**
 * initialize the socket connections
 */
function init() {
    socket = io();
    socket.emit('join-room', roomId, userId);

    userListController(socket);

    webRtcController(socket, peers, localStream);

    socket.on('give-broadcast-permission', socket_id => {
        document.getElementById(socket_id).style.display = 'block';
    });

    socket.on('give-stream-permission', () => {
        giveStreamPermission();
    })



    chatController(socket);

    /* --------------- Rapper Queue start --------------- */
    addUserToQueueButton.addEventListener('click', addUserToQueue);
    becomeRapperButton.addEventListener('click', becomeRapper);
    /* --------------- Rapper Queue end --------------- */
}

    /** ============================== 
     *          Rapper Queue Start 
     * ============================== */
function addUserToQueue() {
    socket.emit('add-user-to-queue', roomId, userId);
    addUserToQueueButton.disabled = true;
}	

function becomeRapper() {
    socket.emit('become-rapper', roomId, userId);
}

    /* =============== Rapper Queue end =============== */



    /** ============================== 
     *          WebRTC Start 
     * ============================== */

    /* =============== WebRTC end =============== */
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
    socket.emit('give-broadcast-permission'); // send request to server
}

/* stream privileges
    remove the element from the DOM when the stream is off
    TODO: users who join after a user is allowed to stream will not see the stream
*/

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


},{"./chatController":1,"./userListController":3,"./webRtcController":4}],3:[function(require,module,exports){
const listUsers = document.getElementById('user-list');
listUsers.style.display = 'none';
const listChat = document.getElementById('messages');
const chatUserListToggle = document.getElementById('flexSwitchCheckChecked');

chatUserListToggle.addEventListener('click', chatUserListToggleVisibility); // toggle div visibility
chatUserListToggle.addEventListener('click', chatUserListSwitchButton);

module.exports.userListController = (socket) => {
    socket.on('update-user-list', users => { onUpdateUserList(users) });
}

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
},{}],4:[function(require,module,exports){
let rapperList = [];

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

module.exports.webRtcController = (socket, peers, localStream) => {
    // get list of rappers in room (allows users that join after to see the rappers)
    socket.on('update-rapper-list', rappers => { rapperList = rappers });

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
            newVid.style.display = 'none'; // hide displays at the beginning
            onUpdateRapperList(rapperList); // check if there are rappers and display their cameras
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
     * Update user list on DOM
     * @param {Array} users
     */
    function onUpdateRapperList(rappers) {
        // TEMPORARY: only 2 rappers at a time
        //if (rappers != undefined && rappers.length == 2) {}
        //if (rappers != undefined && rappers.length >= 1) {}
        if (rappers != undefined && rappers.length > 0) {
            // console log all rappers 
            console.log(rappers);

            // add rapper names to h3 element
            const h3 = document.getElementsByTagName('h3')[0];
            h3.innerHTML = rappers[0].username + ' vs ';
            //h3.innerHTML = rappers[0].username + ' vs ' + rappers[1].username;

            // display rapper streams elements
            //document.getElementById(rappers[0].socket_id).style.display = 'block';
            //document.getElementById(rappers[1].socket_id).style.display = 'block';

                
            // TEMPORARY: only 2 rappers at a time
            // display rapper streams elements
            rappers.forEach(rapper => {
                document.getElementById(rapper.socket_id).style.display = 'block';
            });
        }
    }

}
},{}]},{},[2]);
