const { addUserToQueue, makeRapper, isInQueueAndNotRapper, isRapRoom, 
    checkRoomRequirements, rappersReady, chooseRappers, makeRapRoom, rappersBeenChosen } = require('./db');

module.exports.rapEventLoopController = async (io, socket, roomId) => {

    // update user in user_connected table to is_rapper to true if they are in_queue
    socket.on('become-rapper', async (roomId, userId) => {
        if (await isInQueueAndNotRapper(roomId, userId) == true) {
            await makeRapper(roomId, userId);
            io.to(socket.id).emit('give-stream-permission') // give stream permission to user
        }
    });

    socket.on('give-broadcast-permission', () => {
        // signal all users to allow the stream to be displayed
        socket.broadcast.to(roomId).emit('give-broadcast-permission', socket.id); 
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
    countDown(io, socket, roomId, 10)
}

function countDown(io, socket, roomId, seconds) {
    let timer = setInterval(() => {
        seconds--;
        io.to(roomId).emit('chat-message', seconds);
        console.log('seconds: ' + seconds);
        if(seconds == 0) clearInterval(timer);
    }, 1000);
}