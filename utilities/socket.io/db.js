const { pool } = require('../../dbConfig');

// add users to room table
module.exports.addUserToRoom = async (roomId, userId) => {
    await pool.query(`INSERT INTO user_connected (id, room_id) VALUES($1, $2)`, [userId, roomId]);
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