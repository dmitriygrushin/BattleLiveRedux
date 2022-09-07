const { chatController } = require("./chatController");
const { userListController } = require("./userListController");
const { webRtcController } = require("./webRtcController");
const { clientStreamButtonController } = require("./clientStreamButtonController");
const { rapEventLoopController } = require("./rapEventLoopController");

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
    // for good measure - webRTC is unpredictable
    for (let index in localStream.getVideoTracks()) {
        localStream.getVideoTracks()[index].enabled = isOn;
        localStream.getAudioTracks()[index].enabled = isOn;
    }
}






