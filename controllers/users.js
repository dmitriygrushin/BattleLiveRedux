const bcrypt = require('bcrypt');
const { pool } = require('../dbConfig');

module.exports.registerView = (req, res) => {
    res.render('register');
};

module.exports.loginView = (req, res) => {
    res.render('login');
};

module.exports.dashboardView = (req, res) => {
    res.render('dashboard', {user: req.user.username});
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err); 
    req.flash('success_msg', 'You have logged out');
    res.redirect('/users/login');
  });
};

module.exports.register = async (req, res) => {
    let { username, email, password, password2 } = req.body;
    console.log({ username, email, password, password2 });

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
        console.log(hashedPassword);

        const results = await pool.query(`SELECT * FROM user_account WHERE email = $1`, [email]) ;
        console.log(results.rows);

        if (results.rows.length > 0) {
            errors.push({message: 'Email already registered'});
            res.render('register', { errors });
        } else {
            const results = await pool.query(`INSERT INTO user_account (username, email, password) VALUES ($1, $2, $3) RETURNING id, password`, [username, email, hashedPassword]);
            console.log(results.rows);
            req.flash('success_msg', 'You are now registered please log in');
            res.redirect('/users/login');
        }
    }
}