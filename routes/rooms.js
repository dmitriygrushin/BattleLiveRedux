const express = require('express');
const router = express.Router();
const rooms = require('../controllers/rooms');
const { checkAuthenticated, checkNotAuthenticated } = require('../middleware/authentication');
const catchAsyncErrors = require('../utilities/catchAsyncErrors');


router.get('/create', checkAuthenticated, rooms.createView);

router.post('/create', checkAuthenticated, catchAsyncErrors(rooms.create));

module.exports = router;
