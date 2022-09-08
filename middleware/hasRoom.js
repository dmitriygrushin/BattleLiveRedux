const { pool } = require('../dbConfig');

module.exports.hasRoom = async (userId) => {
    const room = await pool.query(`SELECT id FROM room WHERE user_id = $1`, [userId]);
    return room.rows[0];
}

module.exports.getUserStats = async (userId) => {
    const winLossDraw = await pool.query(`select * from user_stats where id = $1`, [userId]);
    const userStats = winLossDraw.rows[0];
    return `(${userStats.win}W, ${userStats.loss}L, ${userStats.draw}D)`;
}
