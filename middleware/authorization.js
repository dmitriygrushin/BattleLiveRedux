const { hasRoom } = require('../middleware/hasRoom'); 

module.exports.isRoomOwner = async (req, res, next) => {
    const editRoomId = req.params.id; // id of room from url
    const userRoomId = await hasRoom(req.user.id); // authenticated users room id
    if (userRoomId == undefined || editRoomId !== userRoomId.id) {
        req.flash('error', 'You do NOT own that room!');
        return res.redirect('/');
    }
    return next();
}

