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
router.get('/:id/rapRoom', checkAuthenticated, rooms.rapRoomView);

// Update
router.get('/:id/edit', checkAuthenticated, isRoomOwner, rooms.editView);
router.put('/:id/edit', checkAuthenticated, isRoomOwner, catchAsyncErrors(rooms.edit));

// Delete
router.get('/:id/delete', checkAuthenticated, isRoomOwner, rooms.deleteView);
router.delete('/:id/delete', checkAuthenticated, isRoomOwner, catchAsyncErrors(rooms.delete));


module.exports = router;
