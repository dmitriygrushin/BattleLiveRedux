const express = require('express');
const router = express.Router();
const passport = require('passport');
const users = require('../controllers/users');
const { checkAuthenticated, checkNotAuthenticated } = require('../middleware/authentication');
const catchAsyncErrors = require('../utilities/catchAsyncErrors');

router.get('/register', checkNotAuthenticated, users.registerView);
router.get('/login', checkNotAuthenticated, users.loginView);
router.get('/dashboard', checkAuthenticated, users.dashboardView);

router.get('/logout', checkAuthenticated, users.logout);
router.post('/register', checkNotAuthenticated, catchAsyncErrors(users.register));
router.post('/login', checkNotAuthenticated, passport.authenticate('local', { successRedirect: '/users/dashboard', failureRedirect: '/users/login', failureFlash: true }));

module.exports = router;