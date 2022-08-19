const { addUserToQueue, makeRapper, isInQueueAndNotRapper, isRapRoom, getRappersInRoom, 
    checkRoomRequirements, rappersReady, chooseRappers, makeRapRoom, rappersBeenChosen } = require('./db');

module.exports.rapEventLoopController = async (io, socket, roomId) => {

    // update user in user_connected table to is_rapper to true if they are in_queue
    socket.on('become-rapper', async (roomId, userId) => {
        if (await isInQueueAndNotRapper(roomId, userId) == true) {
            await makeRapper(roomId, userId);
            io.to(socket.id).emit('give-stream-permission') // give stream permission to user
        }
    });

    socket.on('display-stream', () => {
        // signal all users to allow the stream to be displayed
        socket.broadcast.to(roomId).emit('display-stream', socket.id); 
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
                
                await startTimers(io, socket, roomId);


                 
            }
        }
    }
}

async function startTimers(io, socket, roomId) {
    countDown(io, socket, roomId, 10, 1);
}

async function giveStreamPermission(roomId, userId) {
    if (await isInQueueAndNotRapper(roomId, userId) == true) {
        await makeRapper(roomId, userId);
        io.to(socket.id).emit('give-stream-permission') // give stream permission to user
    }
}

async function giveRappersStreamPermission(io, socket, roomId) {
    // get rappers in room
    const rappers = await getRappersInRoom(roomId);

    // send signal to rappers to allow stream to be displayed
    for (let i = 0; i < rappers.length; i++) {
        io.to(rappers[i].socket_id).emit('display-stream', rappers[i].socket_id);
    }

    // give chosen rappers stream permission
    await startTimers(io, socket, roomId);  

}

function countDown(io, socket, roomId, seconds, timerCount) {
    let timer = setInterval(() => {
        if (timerCount != 5) {
            if (timerCount == 1) {
                io.to(roomId).emit('timer', 'Get Ready', seconds);
            } else if (timerCount == 2) {
                io.to(roomId).emit('timer', 'Rapper 1', seconds);
            } else if (timerCount == 3) {
                io.to(roomId).emit('timer', 'Rapper 2', seconds);
            } else {
                io.to(roomId).emit('timer', 'Vote', seconds);
            }

            seconds--;

            //console.log('seconds: ' + seconds);

            if(seconds == 0) {
                clearInterval(timer);
                countDown(io, socket, roomId, 7, ++timerCount);
            }
        }
    }, 1000);
}