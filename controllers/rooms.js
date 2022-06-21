const { pool } = require('../dbConfig');
const util = require('util');

// Create
module.exports.createView = (req, res) => {
    res.render('rooms/create');
}

module.exports.create = async (req, res) => {
    const { description } = req.body;
    const userId = req.user.id; // use userId to associate room foreign key with the userId that created it

    // form error checking
    if (description == undefined) return res.status(422).send('Fields CANNOT be UNDEFINED');
    if (!description) {
        req.flash('error', 'Can NOT leave the description field empty');
        // NOTE: if not returned then consecutive requests during testing will create an empty description
        return res.redirect('/rooms/create'); 
    }

    // check if user already created a room
    const checkRoom = await pool.query(`SELECT * FROM room WHERE user_id = $1`, [userId]);

    // redirect if the user already created a room
    if(checkRoom.rows.length > 0) {
        req.flash('error', 'Error: You already created a room');
        return res.redirect('/');
    }

    // add room
    await pool.query(`INSERT INTO room(description, user_id) VALUES($1, $2)`, [description, userId]);

    // flash and redirect
    req.flash('success_msg', 'You CREATED a room!');
    res.redirect('/users/dashboard');
}

// Read
module.exports.rapRoomView = async (req, res) => {
    const roomId = req.params.id;
    const room = await pool.query(
        `SELECT user_account.username, room.id AS room_id, room.description, room.user_id 
        FROM user_account JOIN room ON user_account.id = room.user_id 
        WHERE room.id = $1`, [roomId]);

    if (room.rows.length != 1) {
        req.flash('error', 'This room does NOT exist.');
        return res.redirect('/users/dashboard');
    }

    console.log(room.rows[0].username, room.rows[0].room_id, room.rows[0].description, room.rows[0].user_id);
    res.render('rooms/rapRoom', {room : room.rows[0], owner : room.rows[0].username});
}


// Update
module.exports.editView = async (req, res) => {
    const room = await pool.query(`SELECT * FROM room WHERE id = $1`, [req.params.id]);
    res.render('rooms/edit', { room : room.rows[0]});
}

module.exports.edit = async (req, res) => {
    const { id } = req.params;
    const { description } = req.body;

    // form error checking
    if (description == undefined) return res.status(422).send('Fields CANNOT be UNDEFINED');
    if (!description) {
        req.flash('error', 'Can NOT leave the description field empty');
        // NOTE: if not returned then consecutive requests during testing will create an empty description
        return res.redirect(`/rooms/${id}/edit`); 
    }

    // TODO: changed the updates and delete query to also include the user_id when refactoring
    await pool.query(`UPDATE room SET description = $1 WHERE id = $2`, [description, id]);
    req.flash('success_msg', 'You EDITED your room!');
    res.redirect('/users/dashboard');
}

// Delete
module.exports.deleteView = async (req, res) => {
    const room = await pool.query(`SELECT * FROM room WHERE id = $1`, [req.params.id]);
    res.render('rooms/delete', { room : room.rows[0]});
}

module.exports.delete = async (req, res) => {
    const { id } = req.params;

    await pool.query(`DELETE FROM room WHERE id = $1 AND user_id = $2`, [id, req.user.id]);

    req.flash('success_msg', 'You have DELETED your room');
    res.redirect('/users/dashboard');
}