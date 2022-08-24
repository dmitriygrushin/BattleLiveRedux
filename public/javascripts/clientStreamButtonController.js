module.exports.clientStreamButtonController = (localStream) => {
    const vidButton = document.getElementById('vidButton');
    vidButton.addEventListener('click', toggleVid)

    const muteButton = document.getElementById('muteButton');
    muteButton.addEventListener('click', toggleMute);

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

    /**
     * updating text of buttons depending on the state of video/audio
     */
    function updateButtons() {
        for (let index in localStream.getVideoTracks()) {
            document.getElementById('vidButton').innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
            document.getElementById('vidButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
        }
        for (let index in localStream.getAudioTracks()) {
            document.getElementById('muteButton').innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
            document.getElementById('muteButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
        }
    }
}
