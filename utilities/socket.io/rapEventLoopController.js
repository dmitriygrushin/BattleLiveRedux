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
                    io.to(roomId).emit('timer', 'Refreshing Rappers PLEASE do NOT leave', 0);
                    break;
                case 8:
                    io.to(roomId).emit('timer', 'Getting next rappers ready...', seconds);
                    //io.to(roomId).emit('rappers-finished', rappers[0].socket_id);
                    //io.to(roomId).emit('rappers-finished', rappers[1].socket_id);
                    break;
            }
            seconds--;

            if(seconds <= 0) {
                const readyRapperCount = 10;
                const rapCount = 30;
                const voteCount = 20;
                const announceWinnerCount = 15;
                const getNextRappersReadyCount = 10; 
                const endCount = 10; 

                clearInterval(timer);
                switch(timerCount) {
                    case 1:
                        if (await handleIfRappersLeftRoom(io, roomId)) {
                            await countDown(io, socket, roomId, getNextRappersReadyCount, 7, rappers);
                            break;
                        }
                        // get ready rapper1
                        await countDown(io, socket, roomId, readyRapperCount, ++timerCount, rappers);
                        break;
                    case 2:
                        if (await handleIfRappersLeftRoom(io, roomId)) {
                            await countDown(io, socket, roomId, getNextRappersReadyCount, 7, rappers);
                            break;
                        }
                        // rapper1 turn
                        await countDown(io, socket, roomId, rapCount, ++timerCount, rappers);
                        break;
                    case 3:
                        if (await handleIfRappersLeftRoom(io, roomId)) {
                            await countDown(io, socket, roomId, getNextRappersReadyCount, 7, rappers);
                            break;
                        }
                        // get ready rapper2
                        await countDown(io, socket, roomId, readyRapperCount, ++timerCount, rappers);
                        break;
                    case 4:
                        if (await handleIfRappersLeftRoom(io, roomId)) {
                            await countDown(io, socket, roomId, getNextRappersReadyCount, 7, rappers);
                            break;
                        }
                        // rapper2 turn
                        await countDown(io, socket, roomId, rapCount, ++timerCount, rappers);
                        break;
                    case 5:
                        if (await handleIfRappersLeftRoom(io, roomId)) {
                            await countDown(io, socket, roomId, getNextRappersReadyCount, 7, rappers);
                            break;
                        }
                        
                        // vote
                        /**
                         * if both rappers are STILL in the room
                         */
                        await countDown(io, socket, roomId, voteCount, ++timerCount, rappers);
                        io.to(roomId).emit('vote-rapper');
                        break;
                    case 6:
                        // check that the rappers are in the room before calculating votes
                        if (await handleIfRappersLeftRoom(io, roomId)) {
                            await countDown(io, socket, roomId, getNextRappersReadyCount, 7, rappers);
                            break;
                        }

                        // announce winner
                        io.to(roomId).emit('winner-voted', await calculateRoomVotes(io, roomId));
                        await countDown(io, socket, roomId, announceWinnerCount, ++timerCount, rappers);
                        break;
                    case 7:
                        // Getting next rappers ready...
                        io.to(roomId).emit('rapper-vs-rapper', `_ vs _`);
                        //io.to(roomId).emit('timer', 'Pending', '-1');
                        await refreshRoomVotes(io, roomId);
                        await refreshRappers(io, socket, roomId);
                        io.to(roomId).emit('winner-voted', '_');

                        await countDown(io, socket, roomId, getNextRappersReadyCount, ++timerCount, rappers);
                        break;
                    case 8:
                        // end
                        io.to(roomId).emit('timer', 'Pending', '-1');
                        await countDown(io, socket, roomId, endCount, ++timerCount, rappers);
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

async function handleIfRappersLeftRoom(io, roomId) {
    const rappers = await getRappersInRoom(roomId);
    /**
     * if both rappers LEFT the room (both rappers would get loss++ when upon disconnecting in the disconnectController)
     */
    if (rappers[0] == undefined && rappers[1] == undefined) {
        //await countDown(io, socket, roomId, 10, 7, rappers);
        return true;
    }
    /**
     * if 1 rapper LEFT the room
     */
    if (rappers[0] == undefined || rappers[1] == undefined) {
        // announce winner
        if (rappers[0] == undefined) {
            io.to(roomId).emit('winner-voted', rappers[1].username);
            await pool.query(`UPDATE user_stats SET win = win + 1 WHERE id = $1`, [rappers[1].user_id]);
            await pool.query(`UPDATE user_connected SET is_finished = true where id = $1 AND is_rapper = true`, [rappers[1].user_id]);
        }

        if (rappers[1] == undefined) {
            io.to(roomId).emit('winner-voted', rappers[0].username);
            await pool.query(`UPDATE user_stats SET win = win + 1 WHERE id = $1`, [rappers[0].user_id]);
            await pool.query(`UPDATE user_connected SET is_finished = true where id = $1 AND is_rapper = true`, [rappers[0].user_id]);
        }
        // skip voting and announcing of winner case since it's already been done above
        //await countDown(io, socket, roomId, 10, 7, rappers);
        return true;
    }
    const rapper1 = {'id': rappers[0].user_id, 'username': rappers[0].username};
    const rapper2 = {'id': rappers[1].user_id, 'username': rappers[1].username};
    io.to(roomId).emit('vote-setup', rapper1, rapper2);
    return false;
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
    await pool.query(`UPDATE user_connected SET is_finished = true where id = $1 AND is_rapper = true`, [rappers[0].user_id]);
    await pool.query(`UPDATE user_connected SET is_finished = true where id = $1 AND is_rapper = true`, [rappers[1].user_id]);

    const map = new Map();
    let winner;
    let loser;
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


    // [0]: id, [1]: vote amount
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

    if (!draw) {
        // get loser. can't user rapperXVotes[0] since the user may not have gotten any votes.
        if (winner == rappers[0].user_id) loser = rappers[1].user_id;
        if (winner == rappers[1].user_id) loser = rappers[0].user_id;

        const { rows } = await pool.query(`SELECT username FROM user_account WHERE id = $1`, [winner]);
        await pool.query(`UPDATE user_stats SET win = win + 1 WHERE id = $1`, [winner]);
        await pool.query(`UPDATE user_stats SET loss = loss + 1 WHERE id = $1`, [loser]);
        return rows[0].username;
    }

    // in-case no one voted then rapperXVotes will be undefined so DB call is made
    await pool.query(`UPDATE user_stats SET draw = draw + 1 WHERE id = $1`, [rappers[0].user_id]);
    await pool.query(`UPDATE user_stats SET draw = draw + 1 WHERE id = $1`, [rappers[1].user_id]);
    return 'DRAW!';
}

module.exports = { rapEventLoopController, rapRoomEventLoop }