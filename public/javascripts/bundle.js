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
module.exports.clientStreamButtonController = (localStream) => {
    const vidButton = document.getElementById('vidButton');
    vidButton.addEventListener('click', toggleVid)

    const muteButton = document.getElementById('muteButton');
    muteButton.addEventListener('click', toggleMute);

    vidButton.disabled = true;
    muteButton.disabled = true;

    updateButtons(); // update buttons right when user joins


    /**
     * Enable/disable video
     */
    function toggleVid() {
        for (let index in localStream.getVideoTracks()) {
            localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled;
            vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled";
            vidButton.className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
        }
        updateButtons(); 
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
        updateButtons(); 
    }

    /**
     * updating text of buttons depending on the state of video/audio
     */
    function updateButtons() {
        for (let index in localStream.getVideoTracks()) {
            document.getElementById('vidButton').innerText = localStream.getVideoTracks()[index].enabled ? "✔ Video Enabled" : "❌ Video Disabled"
            document.getElementById('vidButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
        }
        for (let index in localStream.getAudioTracks()) {
            document.getElementById('muteButton').innerText = localStream.getAudioTracks()[index].enabled ? "✔ Unmuted" : "❌ Muted"
            document.getElementById('muteButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
        }
    }
}

},{}],3:[function(require,module,exports){
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

    socket.on('rapper-vs-rapper', rappers => {
        document.getElementById('rapper-vs-rapper').innerHTML = rappers;
    });

    socket.on('timer', (timerType, seconds) => {
        if (timerType == 'Pending') {
            timer.innerHTML = `Timer: [${timerType}]`;
        } else {
            timer.innerHTML = `Timer: [${timerType}: ${seconds}]`;
        }
    });

    // allow both rappers to talk after they're done
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
            toggleMute(true); 
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
        window.location.href = "https://www.google.com/";
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
            localStream.getAudioTracks()[index].enabled = false; // audio is false until it's the client's turn to rap
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
        for (let index in localStream.getVideoTracks()) {
            document.getElementById('vidButton').innerText = localStream.getVideoTracks()[index].enabled ? "✔ Video Enabled" : "❌ Video Disabled"
            document.getElementById('vidButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : " btn btn-success";
        }
        for (let index in localStream.getAudioTracks()) {
            document.getElementById('muteButton').innerText = localStream.getAudioTracks()[index].enabled ? "✔ Unmuted" : "❌ Muted"
            document.getElementById('muteButton').className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
        }
    }

    function toggleMute(isOn) {
        for (let index in localStream.getAudioTracks()) {
            localStream.getAudioTracks()[index].enabled = isOn;
            muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
            muteButton.className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success"
        }
        updateButtons(); 
    }
}

},{}],4:[function(require,module,exports){
const { chatController } = require("./chatController");
const { userListController } = require("./userListController");
const { webRtcController } = require("./webRtcController");
const { clientStreamButtonController } = require("./clientStreamButtonController");
const { rapEventLoopController } = require("./rapEventLoopController");

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
let rapperList = [];

console.log("peers is a: " + typeof peers);

// redirect if not https
if(location.href.substr(0,5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4)

/**
 * UserMedia constraints
 */
let constraints = {
    audio: true,
    video: true
}

constraints.video.facingMode = { ideal: "user" };

videoDiv.style.display = 'none'; // remove visibility of local stream element at the beginning
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
    socket.emit('join-room', roomId, userId, myUsername);

    clientStreamButtonController(localStream);

    userListController(socket);

    webRtcController(socket, peers, localStream, rapperList); // establish basic webRTC connection

    rapEventLoopController(socket, peers, localStream, rapperList); // establish event loop

    chatController(socket);
}

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







},{"./chatController":1,"./clientStreamButtonController":2,"./rapEventLoopController":3,"./userListController":5,"./webRtcController":6}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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

module.exports.webRtcController = (socket, peers, localStream, rapperList) => {
    // get list of rappers in room (allows users that join after to see the rappers)
    socket.on('update-rapper-list', rappers => { rapperList = rappers });

    socket.on('initReceive', (socket_id, username) => {
        console.log('INIT RECEIVE ' + socket_id);
        addPeer(socket_id, false, username);
        socket.emit('initSend', socket_id);
    })

    socket.on('initSend', (socket_id, username) => {
        console.log('INIT SEND ' + socket_id);
        addPeer(socket_id, true, username);
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
        let div = document.getElementById(socket_id);
        let videoEl = document.getElementById(socket_id).getElementsByTagName('video')[0];
        if (videoEl) {

            const tracks = videoEl.srcObject.getTracks();

            tracks.forEach(function (track) {
                track.stop();
            })

            videoEl.srcObject = null;
            videoEl.parentNode.removeChild(videoEl);
            div.remove();
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
    function addPeer(socket_id, isInitiator, username) {
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
            let div = document.createElement('div');
            let pUsername = document.createElement('p');
            pUsername.innerHTML = username;

            let newVid = document.createElement('video');
            newVid.srcObject = stream;
            newVid.playsinline = false;
            newVid.autoplay = true;
            newVid.className = "vid";
            newVid.onclick = () => openPictureMode(newVid);
            newVid.ontouchstart = (e) => openPictureMode(newVid);

            div.id = socket_id;
            div.appendChild(newVid);
            div.appendChild(pUsername);
            videos.appendChild(div);
            div.style.display = 'none'; // hide displays at the beginning
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
            //h3.innerHTML = rappers[0].username + ' vs ';
            h3.innerHTML = rappers[0].username + ' vs ' + rappers[1].username;

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
},{}]},{},[4]);
