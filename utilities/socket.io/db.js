const { pool } = require('../../dbConfig');

// add users to room table
module.exports.addUserToRoom = async (roomId, userId, socket_id) => {
    await pool.query(`INSERT INTO user_connected (id, room_id, socket_id) VALUES($1, $2, $3)`, [userId, roomId, socket_id]);
}

// remove users from room table
module.exports.removeUserFromRoom = async (roomId, userId) => {
    await pool.query(`DELETE FROM user_connected WHERE id = $1 AND room_id = $2`, [userId, roomId]);
}

// get all users in a room
module.exports.getUsersInRoom = async (roomId) => {
    const { rows } = await pool.query(
        `SELECT user_account.username, user_connected.id AS user_id, user_connected.room_id as room_id 
        FROM user_account JOIN user_connected ON user_account.id = user_connected.id 
        WHERE user_connected.room_id = $1`, [roomId]);
    console.log(rows);
    return rows;
}

// get all users from user_connected who are rappers in the room (for the chat)
module.exports.getRappersInRoom = async (roomId) => {
    const { rows } = await pool.query(
        `SELECT user_account.username, 
        user_connected.id AS user_id, 
        user_connected.room_id as room_id, 
        user_connected.socket_id as socket_id
        FROM user_account JOIN user_connected 
        ON user_account.id = user_connected.id 
        WHERE user_connected.room_id = $1 AND user_connected.is_rapper = true`, [roomId]);
    console.log('Current Rappers:' + rows);
    return rows;
}

// change user in user_connected table in_queue to true 
module.exports.addUserToQueue = async (roomId, userId) => {
    await pool.query(
        `UPDATE user_connected SET in_queue = true 
        WHERE id = $1 AND room_id = $2`, [userId, roomId]);
} 

// change user in user_connected table to is_rapper to true if they are in_queue
module.exports.makeRapper = async (roomId, userId) => {
    await pool.query(
        `UPDATE user_connected SET is_rapper = true 
        WHERE id = $1 AND room_id = $2 AND in_queue = true`, [userId, roomId]);
} 

module.exports.getTwoRappers = async (roomId) => {
    const { rows } = await pool.query(
        `SELECT user_account.username, user_connected.id AS user_id, user_connected.room_id as room_id
        FROM user_account JOIN user_connected ON user_account.id = user_connected.id
        WHERE user_connected.room_id = $1 AND user_connected.is_rapper = true
        LIMIT 2`, [roomId]);
    console.log('Current Rappers:' + rows);
    return rows;
}

// return true if the user is in_queue and is not already a rapper 
module.exports.isInQueueAndNotRapper = async (roomId, userId) => {
    const { rows } = await pool.query(
        `SELECT user_connected.id AS user_id, 
        user_connected.room_id as room_id, 
        user_connected.is_rapper as is_rapper, 
        user_connected.in_queue as in_queue
        FROM user_connected
        WHERE id = $1 AND room_id = $2 AND is_rapper = false AND in_queue = true`, [userId, roomId]);
    console.log('Current User:' + rows);
    return rows.length > 0;
}


/**
 * rapRoomEventLoopController.js DB functions
 */

/**
 * Check if the room is a rap room
 */
module.exports.isRapRoom = async (roomId) => {
    const { rows } = await pool.query( `SELECT is_rap_room FROM room WHERE id = $1`, [roomId]);
    return rows[0].is_rap_room;
}

/**
 * Check the room requirements for a room to become a rap room
 */
module.exports.checkRoomRequirements = async (roomId) => {
    const usersInQueue = 2;
    const totalUsers = 2;

    /**
     * Production room requirements: 2 rappers in_queue, 10 users total
     * Testing room requirements: 2 rappers in_queue, 2 users total
        `SELECT user_account.username, room.id AS room_id, room.description, room.user_id 
        FROM user_account JOIN room ON user_account.id = room.user_id 
        WHERE room.id = $1`, [roomId]
     */

    // select all user_connected in the room
    const { rows } = await pool.query(
        `SELECT user_connected.id AS user_id,
        user_connected.room_id as room_id,
        user_connected.is_rapper as is_rapper,
        user_connected.in_queue as in_queue
        FROM user_connected
        WHERE room_id = $1`, [roomId]);
    console.log('Current Users:' + rows);
    // if the room has less than 2 rappers in_queue, return false

    let isEnoughInQueue = rows.filter(user => user.in_queue == true).length >= usersInQueue;  
    let isEnoughUsers = rows.length >= totalUsers;

    return isEnoughInQueue && isEnoughUsers;
}

module.exports.chooseRappers = async (roomId) => {
    // out of the rappers in the room who are in_queue, choose 2 to be rappers update is_rapper to true
    const { rows } = await pool.query(
        `SELECT user_connected.id AS user_id,
        user_connected.room_id as room_id,
        user_connected.is_rapper as is_rapper,
        user_connected.in_queue as in_queue
        FROM user_connected
        WHERE room_id = $1 AND in_queue = true
        LIMIT 2`, [roomId]);

    // if the room has less than 2 rappers in_queue, return false
    if (rows.length < 2) {
        return false;
    }

    // update is_rapper to true for the rappers in_queue
    await pool.query(
        `UPDATE user_connected SET is_rapper = true
        WHERE id = $1 AND room_id = $2 AND in_queue = true`, [rows[0].user_id, roomId]);
    await pool.query(
        `UPDATE user_connected SET is_rapper = true
        WHERE id = $1 AND room_id = $2 AND in_queue = true`, [rows[1].user_id, roomId]);

    return true;
}

module.exports.rappersReady = async (roomId) => {
    const { rows } = await pool.query(
        `SELECT user_connected.id AS user_id,
        user_connected.room_id as room_id,
        user_connected.is_rapper as is_rapper,
        user_connected.in_queue as in_queue
        FROM user_connected
        WHERE room_id = $1 AND is_rapper = true AND in_queue = true AND is_ready = true`, [roomId]);
    console.log('Current Users:' + rows);
    return rows.length > 0;
}

module.exports.makeRapRoom = async (roomId) => {
    await pool.query( `UPDATE room SET is_rap_room = true WHERE id = $1`, [roomId]);
    return true;
}

module.exports.rappersBeenChosen = async (roomId) => {
    // check if 2 rappers are in_queue and are rappers
    const { rows } = await pool.query(
        `SELECT user_connected.id AS user_id,
        user_connected.room_id as room_id,
        user_connected.is_rapper as is_rapper,
        user_connected.in_queue as in_queue
        FROM user_connected
        WHERE room_id = $1 AND is_rapper = true AND in_queue = true`, [roomId]);
    return rows.length == 2;
}