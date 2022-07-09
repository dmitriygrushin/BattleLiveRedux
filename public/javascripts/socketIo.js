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

