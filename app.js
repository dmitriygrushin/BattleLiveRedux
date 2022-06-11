const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const { checkNotAuthenticated } = require('./middleware');

const initializePassport = require('./passportConfig');
initializePassport(passport);

const userRoutes = require('./routes/users');

/* Middleware */
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false })); // allows front-end forms to send fields to back-end

app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Routes
app.use('/users', userRoutes);

app.get('/', checkNotAuthenticated, (req, res) => {
    res.render('index');
});

module.exports = app;