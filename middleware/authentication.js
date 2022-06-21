module.exports.checkAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'You need to login first.');
    res.redirect('/users/login');
}

module.exports.checkNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('error', 'You need to logout first.');
        return res.redirect('/users/dashboard');
    }
    next();
}
