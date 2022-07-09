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