module.exports.clientStreamButtonController = (localStream, constraints) => {
    const vidButton = document.getElementById('vidButton');
    vidButton.addEventListener('click', toggleVid)

    const muteButton = document.getElementById('muteButton');
    muteButton.addEventListener('click', toggleMute);

    vidButton.disabled = true;
    muteButton.disabled = true;

    updateButtons(); // update buttons right when user joins

    const copyRoomLinkButton = document.getElementById('copyRoomLinkButton');

    copyRoomLinkButton.addEventListener('click', () => {
        //window.navigator.clipboard.writeText(textToCopy);
        navigator.clipboard.writeText(window.location.href);
    })



    /**
     * Enable/disable video
     */
    function toggleVid() {
        if (constraints.video){
            for (let index in localStream.getVideoTracks()) {
                localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled;
                vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled";
                vidButton.className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
            }
            updateButtons(); 
        }
    }

    /**
     * Enable/disable microphone
     */
    function toggleMute() {
        if (constraints.audio) {
            for (let index in localStream.getAudioTracks()) {
                localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
                muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
                muteButton.className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success"
            }
            updateButtons(); 
        }
    }

    /**
     * updating text of buttons depending on the state of video/audio
     */
    function updateButtons() {
        if (constraints.video) {
            for (let index in localStream.getVideoTracks()) {
                document.getElementById('vidButton').innerText = localStream.getVideoTracks()[index].enabled ? "✔ Video Enabled" : "❌ Video Disabled"
                document.getElementById('vidButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
            }
        }

        if (constraints.audio) {
            for (let index in localStream.getAudioTracks()) {
                document.getElementById('muteButton').innerText = localStream.getAudioTracks()[index].enabled ? "✔ Unmuted" : "❌ Muted"
                document.getElementById('muteButton').className = localStream.getAudioTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
                // may be a bug: document.getElementById('muteButton').className = localStream.getVideoTracks()[index].enabled ? "btn btn-danger" : "btn btn-success";
            }
        }

    }
}
