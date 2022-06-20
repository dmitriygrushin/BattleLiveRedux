const { pool } = require('../dbConfig');

module.exports.hasRoom = async (userId) => {
    const room = await pool.query(`SELECT id FROM room WHERE user_id = $1`, [userId]);
    return room.rows[0];
}