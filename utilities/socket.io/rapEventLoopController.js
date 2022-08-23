const { addUserToQueue, isRapRoom, getRappersInRoom, 
    checkRoomRequirements, rappersReady, chooseRappers, makeRapRoom, rappersBeenChosen, makeNotRapRoom } = require('./db');

module.exports.rapEventLoopController = async (io, socket, roomId) => {

    // update user in user_connected table to is_rapper to true if they are in_queue
    /*
    socket.on('become-rapper', async (roomId, userId) => {
        if (await isInQueueAndNotRapper(roomId, userId) == true) {
            await makeRapper(roomId, userId);
            io.to(socket.id).emit('give-stream-permission') // give stream permission to user
        }
    });
    */

    socket.on('display-stream', () => {
        // signal all users to allow the stream to be displayed
        socket.broadcast.to(roomId).emit('display-stream', socket.id); 
        console.log("socket.on('display-stream')");
    });

    /**
     * Event Loop
     */
    socket.on('add-user-to-queue', async (roomId, userId) => { 
        await addUserToQueue(roomId, userId);
        await rapRoomEventLoop(io, socket, roomId);
    });

    await rapRoomEventLoop(io, socket, roomId);
}

async function rapRoomEventLoop(io, socket, roomId) {
    // check if not a rap room. If not, make it a rap room
    //io.to(roomId).emit('chat-message', '0');
    if (!(await isRapRoom(roomId))) {
        //io.to(roomId).emit('chat-message', '1');
        if (await checkRoomRequirements(roomId)) {
            //io.to(roomId).emit('chat-message', '2');
            // if 2 rappers have not already been chosen, then choose 2 rappers
            if (!(await rappersBeenChosen(roomId))) {
                //io.to(roomId).emit('chat-message', '3');
                await chooseRappers(roomId);  
            }

            // check if rappers are ready
            if (!(await rappersReady(roomId))) { // negated for testing purposes
                //io.to(roomId).emit('chat-message', '4');
                await makeRapRoom(roomId);
                //await startTimers(io, socket, roomId);
                await setupRappers(io, socket, roomId);
            }
        }
    }
}

async function startTimers(io, socket, roomId) {
    const rappers = await getRappersInRoom(roomId);
    countDown(io, socket, roomId, 10, 1, rappers);
}

async function giveStreamPermission(io, socketId, socket) {
    //if (await isInQueueAndNotRapper(roomId, socketId) == true) {
        //await makeRapper(roomId, socketId);
        io.to(socketId).emit('give-stream-permission'); // give stream permission to user
        //socket.broadcast.to(roomId).emit('display-stream', socketId); 
        console.log('giveStreamPermission Function')
    //}
}

/**
 * Give rappers stream permission to display stream and start timer
 */
async function setupRappers(io, socket, roomId) {
    // get rappers in room
    const rappers = await getRappersInRoom(roomId);
    io.to(roomId).emit('rapper-vs-rapper', `(1st)${rappers[0].username} vs (2nd)${rappers[1].username}`);
    console.log('setupRappers Function');
    // send signal to rappers to allow stream to be displayed 
    for (let i = 0; i < rappers.length; i++) {
        await giveStreamPermission(io, rappers[i].socket_id, socket);
    }

    // give chosen rappers stream permission
    await startTimers(io, socket, roomId);  

}

async function refreshRappers(io, socket, roomId) {
    const rappers = await getRappersInRoom(roomId);
    for (let i = 0; i < rappers.length; i++) {
        io.to(rappers[i].socket_id).emit('refresh-rapper'); 
    }
}

async function countDown(io, socket, roomId, seconds, timerCount, rappers) {
    let timer = setInterval(async () => {
        if (timerCount != 5) {
            if (timerCount == 1) {
                io.to(roomId).emit('timer', 'Get Ready', seconds);
            } else if (timerCount == 2) {
                io.to(roomId).emit('timer', rappers[0].username, seconds);
                io.to(roomId).emit('selected-rapper', rappers[0].socket_id);
            } else if (timerCount == 3) {
                io.to(roomId).emit('timer', rappers[1].username, seconds);
                io.to(roomId).emit('selected-rapper', rappers[1].socket_id);
            } else {
                io.to(roomId).emit('timer', 'Vote', seconds);
                io.to(roomId).emit('selected-rapper', '-1');
            }

            seconds--;

            //console.log('seconds: ' + seconds);

            if(seconds == 0) {
                clearInterval(timer);
                countDown(io, socket, roomId, 7, ++timerCount, rappers);
            }
        } else {
            io.to(roomId).emit('rapper-vs-rapper', `_ vs _`);
            await makeNotRapRoom(roomId);
            refreshRappers(io, socket, roomId);
            clearInterval(timer);
        }
    }, 1000);
}