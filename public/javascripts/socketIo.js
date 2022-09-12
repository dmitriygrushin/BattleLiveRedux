const DetectRTC = require('detectrtc');
DetectRTC.load(() => {
/*
DetectRTC.hasWebcam; // (has webcam device!)
DetectRTC.hasMicrophone; // (has microphone device!)
DetectRTC.hasSpeakers; // (has speakers!)

DetectRTC.isWebSocketsSupported;
DetectRTC.isWebSocketsBlocked;

DetectRTC.isWebsiteHasWebcamPermissions;        // getUserMedia allowed for HTTPs domain in Chrome?
DetectRTC.isWebsiteHasMicrophonePermissions;    // getUserMedia allowed for HTTPs domain in Chrome?

DetectRTC.audioInputDevices;    // microphones
DetectRTC.audioOutputDevices;   // speakers
DetectRTC.videoInputDevices;    // cameras

DetectRTC.isCanvasSupportsStreamCapturing;
DetectRTC.isVideoSupportsStreamCapturing;
*/


// MAIN
const { chatController } = require("./chatController");
const { userListController } = require("./userListController");
const { webRtcController } = require("./webRtcController");
const { clientStreamButtonController } = require("./clientStreamButtonController");
const { rapEventLoopController } = require("./rapEventLoopController");

let socket;
let localStream = null;
let peers = {};
let rapperList = [];
let userMediaAccess;

// redirect if not https
if(location.href.substr(0,5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4)

// what user media permissions will be asked

videoDiv.style.display = 'none'; // remove visibility of local stream element at the beginning
// enabling the camera at startup
main();
function main() {
    let constraints = null;

    userMediaAccess = getUserMediaAccess();

    if (userMediaAccess.hasAllDevicesAndPermissions) {
        constraints = { audio: true, video: true };
        startInit(constraints);
    } else if (userMediaAccess.hasAudioReady && !userMediaAccess.hasVideoReady) {
        constraints = { audio: true, video: false };

        document.getElementById('vidButton').style.display = 'none';

        startInit(constraints);
    } else {
        constraints = { audio: false, video: false };

        document.getElementById('muteButton').style.display = 'none';
        document.getElementById('vidButton').style.display = 'none';
        document.getElementById('addUserToQueue').style.display = 'none';

        init(constraints);
    }

}
    /* =============== WebRTC end =============== */

/**
 * initialize the socket connections
 */
function init(constraints) {
    socket = io();
    socket.emit('join-room', roomId, userId, myUsername);

    console.log(`init constraints.video : ${constraints.video}`);
    console.log(`init constraints.audio : ${constraints.audio}`);

    clientStreamButtonController(localStream, constraints);

    userListController(socket);

    webRtcController(socket, peers, localStream, rapperList); // establish basic webRTC connection

    rapEventLoopController(socket, peers, localStream, constraints); // establish event loop

    chatController(socket);
}

function streamOn(isOn, constraints) {
    //if (userMediaAccess.hasAllDevicesAndPermissions) {
    if (constraints.video && constraints.audio) {
        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                // disable all tracks
                peers[socket_id].streams[0].getTracks()[index].enabled = isOn; 
            }
        }
    }

    /* 
    * for good measure - webRTC is unpredictable 
    */
    if (constraints.video) {
        for (let index in localStream.getVideoTracks()) {
            localStream.getVideoTracks()[index].enabled = isOn;
        }
    }

    if (constraints.audio) {
        for (let index in localStream.getAudioTracks()) {
            localStream.getAudioTracks()[index].enabled = isOn;
        }
    }
}

function startInit(constraints) {
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        console.log('Received local stream');
        localVideo.srcObject = stream;
        localStream = stream;
        streamOn(false, constraints); // disable all users local streams at the beginning

        init(constraints);

    }).catch(e => alert(`getUserMedia error ${e.name}`))
}

// return the permissions the user allowed
function getUserMediaAccess () {
    return {
            hasWebcam : DetectRTC.hasWebcam,
            hasMicrophone : DetectRTC.hasMicrophone,
            webcamPermissions : DetectRTC.isWebsiteHasWebcamPermissions,
            microphonePermissions : DetectRTC.isWebsiteHasMicrophonePermissions,
            hasAllDevices : DetectRTC.hasWebcam && DetectRTC.hasMicrophone,
            hasAllPermissions : DetectRTC.isWebsiteHasWebcamPermissions && DetectRTC.isWebsiteHasMicrophonePermissions,
            hasAllDevicesAndPermissions : DetectRTC.hasWebcam && DetectRTC.hasMicrophone && DetectRTC.isWebsiteHasWebcamPermissions && DetectRTC.isWebsiteHasMicrophonePermissions,
            hasVideoReady : DetectRTC.hasWebcam && DetectRTC.isWebsiteHasWebcamPermissions,
            hasAudioReady : DetectRTC. hasMicrophone && DetectRTC.isWebsiteHasMicrophonePermissions
        };
    }
});





