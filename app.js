const express = require('express');
const app = express();

require("dotenv").config();
const isProduction = process.env.NODE_ENV === "production";

const fs = require('fs');
const path = require('path');
const http = isProduction ? require('http') : require('httpolyglot');


/*
const options = {
    key: fs.readFileSync(path.join(__dirname,'.','ssl','key.pem'), 'utf-8'),
    cert: fs.readFileSync(path.join(__dirname,'.','ssl','cert.pem'), 'utf-8')
}
*/

//const { socketIo } = require('./utilities/socket.io/socket.io');

const session = require('cookie-session');
const flash = require('express-flash');

const methodOverride = require('method-override')
const ejsMate = require('ejs-mate');

const { hasRoom, getUserStats } = require('./middleware/hasRoom');

const passport = require('passport');
const initializePassport = require('./passportConfig');
initializePassport(passport);

const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');

/* Middleware */
app.engine('ejs', ejsMate); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false })); 
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(async (req, res, next) => {
    res.locals.authenticatedUser = req.user;
    res.locals.currentUrl = req.url;
    if (req.user) {
        res.locals.authenticatedUser.username += ` ${await getUserStats(req.user.id)} `;
        const userRoomId = await hasRoom(req.user.id);
        res.locals.authenticatedUserRoomId = (userRoomId == undefined) ? false : userRoomId.id; 
    }
    next();
});

app.get('/', (req, res) => {
    res.render('index');
});

// Routes
app.use('/users', userRoutes);
app.use('/rooms', roomRoutes);

const httpsServer = isProduction ? http.createServer(app) : http.createServer({ key: fs.readFileSync(path.join(__dirname,'.','ssl','key.pem'), 'utf-8'), cert: fs.readFileSync(path.join(__dirname,'.','ssl','cert.pem'), 'utf-8') }, app);
const io = require('socket.io')(httpsServer);
require('./utilities/socket.io/socketController')(io);

module.exports = httpsServer;