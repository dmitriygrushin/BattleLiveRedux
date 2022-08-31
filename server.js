const app = require('./app');

const PORT = process.env.PORT || 3000;

const { pool } = require('./dbConfig');

app.listen(PORT, async (req, res) => {
    console.log(`Listening on port: ${PORT}`);
    await pool.query(`DELETE FROM user_connected; UPDATE room SET is_rap_room = false`);
});