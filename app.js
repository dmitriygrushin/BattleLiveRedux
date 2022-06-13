const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('express-flash');
const ejsMate = require('ejs-mate');
const path = require('path');
const passport = require('passport');
const { checkNotAuthenticated } = require('./middleware');

const initializePassport = require('./passportConfig');
initializePassport(passport);

const userRoutes = require('./routes/users');

/* Middleware */
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false })); 
app.use(express.static(path.join(__dirname, 'public')));

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