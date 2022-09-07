const bcrypt = require('bcrypt');
const { pool } = require('../dbConfig');
const util = require('util');

module.exports.registerView = (req, res) => {
    res.render('register');
};

module.exports.loginView = (req, res) => {
    res.render('login');
};

module.exports.dashboardView = (req, res) => {
    //console.log(util.inspect(req.user, {showHidden: false, depth: null, colors: true}));
    res.render('dashboard');
};

module.exports.logout = (req, res, next) => {
    req.logout();
    req.flash('success_msg', 'You have logged out');
    res.redirect('/users/login');
};

module.exports.register = async (req, res) => {
    let { username, email, password, password2 } = req.body;
    //console.log({ username, email, password, password2 });

    let errors = [];

    if (username == undefined || email == undefined || password == undefined || password2 == undefined) return res.status(422).send('Fields CANNOT be UNDEFINED');
    if (!username || !email || !password || !password2) errors.push({message: 'Please enter all fields'});
    if (password.length < 6 ) errors.push({message: 'Password should be at least 6 characters'});
    if (password != password2) errors.push({message: 'Passwords DO NOT match'});

    if (errors.length > 0) {
        res.render('register', { errors }); 
    } else {
        // form validation passed
        let hashedPassword = await bcrypt.hash(password, 10);
        //console.log(hashedPassword);

        const results = await pool.query(`SELECT * FROM user_account WHERE email = $1 or username = $2`, [email, username]);
        //console.log(results.rows);

        if (results.rows.length > 0) {
            errors.push({message: 'Email or Username already registered'});
            res.render('register', { errors });
        } else {
            const results = await pool.query(`INSERT INTO user_account (username, email, password) VALUES ($1, $2, $3) RETURNING id, password`, [username, email, hashedPassword]);
            await pool.query(`INSERT INTO user_stats (id) VALUES ($1)`, [results.rows[0].id]);
            //console.log(results.rows);
            req.flash('success_msg', 'You are now registered please log in');
            res.redirect('/users/login');
        }
    }
}
