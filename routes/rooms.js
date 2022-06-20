const express = require('express');
const router = express.Router();
const rooms = require('../controllers/rooms');
const { checkAuthenticated } = require('../middleware/authentication');
const { isRoomOwner } = require('../middleware/authorization');
const catchAsyncErrors = require('../utilities/catchAsyncErrors');


// Create
router.get('/create', checkAuthenticated, rooms.createView);
router.post('/create', checkAuthenticated, catchAsyncErrors(rooms.create));

// Read

// Update
router.get('/:id/edit', checkAuthenticated, isRoomOwner, rooms.editView);
router.put('/:id/edit', checkAuthenticated, isRoomOwner, catchAsyncErrors(rooms.edit));

// Delete



module.exports = router;
