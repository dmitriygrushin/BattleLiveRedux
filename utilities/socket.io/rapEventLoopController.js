const { addUserToQueue, isRapRoom, getRappersInRoom, 
    checkRoomRequirements, rappersReady, chooseRappers, makeRapRoom, rappersBeenChosen, makeNotRapRoom } = require('./db');

const { pool } = require('../../dbConfig');

async function rapEventLoopController (io, socket, roomId) {
    socket.data.user = {'vote': -1}; // initial user data. 

    socket.on('display-stream', () => {
        // signal all users to allow the stream to be displayed
        socket.broadcast.to(roomId).emit('display-stream', socket.id); 
        console.log("socket.on('display-stream')");
    });

    // user_id of the user they voted for
    socket.on('vote-rapper', id => {
        socket.data.user.vote = id;
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
    await countDown(io, socket, roomId, 15, 1, rappers);
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

    /**
     * Setup vote form when rappers are being setup
     */
    const rapper1 = {'id': rappers[0].user_id, 'username': rappers[0].username};
    const rapper2 = {'id': rappers[1].user_id, 'username': rappers[1].username};
    io.to(roomId).emit('vote-setup', rapper1, rapper2);

    // send what rappers are battling
    io.to(roomId).emit('rapper-vs-rapper', `${rappers[0].username} vs ${rappers[1].username}`);

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
        if (timerCount <= 8) {
            switch(timerCount) {
                case 1:
                    io.to(roomId).emit('timer', `Get Ready! Everyone!`, seconds);
                    break;
                case 2:
                    io.to(roomId).emit('timer', `Get Ready! ${rappers[0].username}`, seconds);
                    break;
                case 3:
                    io.to(roomId).emit('timer', `Spit Some Heat: ${rappers[0].username}`, seconds);
                    io.to(roomId).emit('selected-rapper', rappers[0].socket_id);
                    break;
                case 4:
                    io.to(roomId).emit('timer', `Get Ready! ${rappers[1].username}`, seconds);
                    break;
                case 5:
                    io.to(roomId).emit('timer', `Spit Some Heat: ${rappers[1].username}`, seconds);
                    io.to(roomId).emit('selected-rapper', rappers[1].socket_id);
                    break;
                case 6:
                    io.to(roomId).emit('timer', 'Vote', seconds);
                    //io.to(roomId).emit('selected-rapper', '-1');
                    // allow both rappers to have their mics on
                    io.to(roomId).emit('rappers-finished', rappers[0].socket_id);
                    io.to(roomId).emit('rappers-finished', rappers[1].socket_id);
                    break;
                case 7:
                    // announce winner
                    io.to(roomId).emit('timer', 'Vote', 0);
                    break;
                case 8:
                    io.to(roomId).emit('timer', 'Getting next rappers ready...', seconds);
                    //io.to(roomId).emit('rappers-finished', rappers[0].socket_id);
                    //io.to(roomId).emit('rappers-finished', rappers[1].socket_id);
                    break;
            }
            seconds--;

            if(seconds <= 0) {
                clearInterval(timer);
                switch(timerCount) {
                    case 1:
                        // get ready rapper1
                        await countDown(io, socket, roomId, 5, ++timerCount, rappers);
                        break;
                    case 2:
                        // rapper1 turn
                        await countDown(io, socket, roomId, 5, ++timerCount, rappers);
                        break;
                    case 3:
                        // get ready rapper2
                        await countDown(io, socket, roomId, 5, ++timerCount, rappers);
                        break;
                    case 4:
                        // rapper2 turn
                        await countDown(io, socket, roomId, 5, ++timerCount, rappers);
                        break;
                    case 5:
                        // vote
                        {
                            const rappers = await getRappersInRoom(roomId);
                            // check if a rapper left the room
                            if (rappers[0] == undefined || rappers[1] == undefined) {
                                // announce winner
                                if (rappers[0] == undefined) io.to(roomId).emit('winner-voted', rappers[1].username);
                                if (rappers[1] == undefined) io.to(roomId).emit('winner-voted', rappers[0].username);
                                // skip voting and announcing of winner case since it's already been done above
                                await countDown(io, socket, roomId, 10, 7, rappers);
                                break;
                            }
                            const rapper1 = {'id': rappers[0].user_id, 'username': rappers[0].username};
                            const rapper2 = {'id': rappers[1].user_id, 'username': rappers[1].username};
                            io.to(roomId).emit('vote-setup', rapper1, rapper2);
                        }
                        await countDown(io, socket, roomId, 10, ++timerCount, rappers);
                        io.to(roomId).emit('vote-rapper');
                        break;
                    case 6:
                        // announce winner
                        io.to(roomId).emit('winner-voted', await calculateRoomVotes(io, roomId));
                        await countDown(io, socket, roomId, 10, ++timerCount, rappers);
                        break;
                    case 7:
                        // Getting next rappers ready...
                        io.to(roomId).emit('rapper-vs-rapper', `_ vs _`);
                        //io.to(roomId).emit('timer', 'Pending', '-1');
                        await refreshRoomVotes(io, roomId);
                        await refreshRappers(io, socket, roomId);
                        io.to(roomId).emit('winner-voted', '_');

                        await countDown(io, socket, roomId, 5, ++timerCount, rappers);
                        break;
                    case 8:
                        io.to(roomId).emit('timer', 'Pending', '-1');
                        await countDown(io, socket, roomId, 5, ++timerCount, rappers);
                        break;
                }
            }
        } else {
            await makeNotRapRoom(roomId);
            await rapRoomEventLoop(io, socket, roomId);
            /*
            io.to(roomId).emit('rapper-vs-rapper', `_ vs _`);
            io.to(roomId).emit('timer', 'Pending', '-1');
            await refreshRappers(io, socket, roomId);
            await makeNotRapRoom(roomId);
            */
            clearInterval(timer);
        }
    }, 1000);
}


async function refreshRoomVotes(io, roomId) {
    let userList = await io.in(roomId).fetchSockets(); 
    userList.forEach(socket => { socket.data.user.vote = -1; });
    io.to(roomId).emit('refresh-votes');
}


async function calculateRoomVotes(io, roomId) {
    const rappers = await getRappersInRoom(roomId);
    const rapper1 = {'id': rappers[0].user_id};
    const rapper2 = {'id': rappers[1].user_id};

    const map = new Map();
    let winner;
    let draw = false;
    let userList = await io.in(roomId).fetchSockets(); 
    userList.forEach(socket => { 
        if (socket.data.user.vote != -1 || socket.data.user.vote == rapper1.id || socket.data.user.vote == rapper2.id) {
            if (map.has(socket.data.user.vote)) {
                // increment occurrence
                map.set(socket.data.user.vote, map.get(socket.data.user.vote) + 1);
            } else {
                // initialize occurrence
                map.set(socket.data.user.vote, 1);
            }
        }
    });

    const rapper1Votes = [...map][0];
    const rapper2Votes = [...map][1];

    // undefined is if no one voted for the rapper
    if (rapper1Votes == undefined && rapper2Votes == undefined) {
        draw = true;
    } else if (rapper1Votes == undefined) {
        console.log('winner: rapper2: ' + rapper2Votes[0]);
        winner = rapper2Votes[0];
    } else if (rapper2Votes == undefined) {
        console.log('winner: rapper1: ' + rapper1Votes[0]);
        winner = rapper1Votes[0];
    }


    // [0]: id, [1]: vote #
    if (rapper1Votes != undefined && rapper2Votes != undefined) {
        if (rapper1Votes[1] > rapper2Votes[1]) {
            console.log('winner: rapper1');
            winner = rapper1Votes[0];
        } else if (rapper1Votes[1] < rapper2Votes[1]) {
            console.log('winner: rapper2');
            winner = rapper2Votes[0];
        } else {
            console.log('draw');
            draw = true;
        }
    }


    // get username of the winner
    if (!draw) {
        const { rows } = await pool.query(`SELECT username FROM user_account WHERE id = $1`, [winner]);
        return rows[0].username;
    }

    return 'DRAW!';
}

module.exports = { rapEventLoopController, rapRoomEventLoop }