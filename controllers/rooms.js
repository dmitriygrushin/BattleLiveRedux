const { pool } = require('../dbConfig');
const util = require('util');

// Create
module.exports.createView = (req, res) => {
    res.render('rooms/create');
}

module.exports.create = async (req, res) => {
    const { description } = req.body;
    const userId = req.user.id; // use userId to associate room foreign key with the userId that created it

    // error checking
    if (description == undefined) return res.status(422).send('Fields CANNOT be UNDEFINED');
    if (!description) {
        req.flash('error', 'Can NOT leave the description field empty');
        // if not returned then consecutive requests during testing will create an empty description
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
    req.flash('success_msg', 'You created a room!');
    res.redirect('/users/dashboard');
}


// Read

// Update

// Delete