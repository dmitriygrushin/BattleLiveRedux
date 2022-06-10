const LocalStrategy = require('passport-local').Strategy;
const { pool } = require('./dbConfig');
const bcrypt = require('bcrypt');

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            const results = await pool.query(`SELECT * FROM user_account WHERE email = $1`, [email]);

            console.log(results.rows);

            if (results.rows.length > 0) {
                const user = results.rows[0];
                console.log(`user reached here: ${user}`);
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) return done(null, user);
                    return done(null, false, {message: 'Password is NOT correct'});
                });
            } else {
                return done(null, false, {message: 'Email is not registered'})
            }
        } catch (error) {
            throw error;
        }
    }

    passport.use(new LocalStrategy( { usernameField: 'email', passwordField: 'password' }, authenticateUser));

    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser(async (id, done) => {
        try {
            const results = await pool.query(`SELECT * FROM user_account WHERE id = $1`, [id]);
            return done(null, results.rows[0]);
        } catch(error) {
            throw error;
        }
    });
}

module.exports = initialize;