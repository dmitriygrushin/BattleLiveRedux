const express = require('express');
const app = express();
const { pool } = require('./dbConfig');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const util = require('util');

const initializePassport = require('./passportConfig');

initializePassport(passport);

/* Middleware */
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // allows front-end forms to send fields to back-end

app.use(
    session({
        secret: 'secret',

        resave: false,

        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.get('/', checkNotAuthenticated, (req, res) => {
    res.render('index');
});

app.get('/users/register', checkNotAuthenticated, (req, res) => {
    //res.render('register');
    res.render('register');
});

app.get('/users/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
});

app.get('/users/dashboard', checkAuthenticated, (req, res) => {
    res.render('dashboard', {user: req.user.username});
});

/*
app.get('/users/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) return next(err); 
    req.flash('success_msg', 'You have logged out');
    res.redirect('/users/login');
  });
});
*/

app.get('/users/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err); 
    req.flash('success_msg', 'You have logged out');
    res.redirect('/users/login');
  });
});


app.post('/users/register', async (req, res) => {
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

        try {
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
        } catch (error) {
            throw error;
        }
    }

});

app.post('/users/login', passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
}));

/*
app.post('/users/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) res.redirect('/users/login'); // failure
    req.logIn(user, (err) => {
      if (err) return next(err); 
      return res.redirect('/users/dashboard'); //success
    });
  })(req, res, next);
});
*/

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/users/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/users/dashboard');
    next();
}

module.exports = app;