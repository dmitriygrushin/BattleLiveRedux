process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const session = require('supertest-session');
const myApp = require('../../app');
const { pool } = require('../../dbConfig');

const testAccount = { email:  'loginTestUser@gmail.com', password: '123456' };

const loginUrl = '/users/login',
    notAuthenticatedRedirect = '/users/login';

const createRoomUrl = '/rooms/create';

const successfulCreateRoomRedirect = '/users/dashboard', 
    successfulDeleteRoomRedirect = '/users/dashboard', 
    successfulLoginRedirect = '/users/dashboard';

const unAuthorizedRoomRedirect = '/';

const nonExistingDeleteRoomUrl = '/rooms/0/delete';
let usersRoomId;
let existingDeleteRoomUrl; // /rooms/${usersRoomId}/delete

const completeCreateRoomFormObj = { description: 'generic create description from delete test' };

let basicSession = null;
 
beforeEach(() => {
    basicSession = session(myApp);
});

afterAll(async () => {
    await pool.query(`DELETE FROM room WHERE user_id = 1`); // clean up db to test again
    pool.end();
});

describe('Room CRUD: DELETE | DELETE /rooms/:id/delete', () => {
    describe('Given the user is Authenticated and did NOT create a room', () => {
        let authenticatedSession;
    
        // Authenticate User
        beforeEach((done) => {
            basicSession.post(loginUrl).type('form')
            .send(testAccount)
            .expect(302) 
            .expect('Location', successfulLoginRedirect)
            .end(function (err) {
                if (err) return done(err);
                authenticatedSession = basicSession; // save the session
                return done();
            });
        });
        
        // SAD
        test(`should redirect to ${unAuthorizedRoomRedirect} if GET failed`, async () => {
            const response = await authenticatedSession.get(nonExistingDeleteRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })

        // SAD
        test(`should redirect to ${unAuthorizedRoomRedirect} if DELETE failed`, async () => {
            const response = await authenticatedSession.delete(nonExistingDeleteRoomUrl).type('form');
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })
    });

    describe('Given the user is Authenticated and DID create a room', () => {
        let authenticatedSession;
    
        // Authenticate User
        beforeEach((done) => {
            basicSession.post(loginUrl).type('form')
            .send(testAccount)
            .expect(302) 
            .expect('Location', successfulLoginRedirect)
            .end(function (err) {
                if (err) return done(err);
                authenticatedSession = basicSession; // save the session
                return done();
            });
        });

        /* Creating Room */
        // HAPPY
        test(`should redirect to ${successfulCreateRoomRedirect} - complete form`, async () => {
            const response = await authenticatedSession.post(createRoomUrl).type('form').send(completeCreateRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(successfulCreateRoomRedirect);
        });

        // HAPPY - testing if the user created a room
        test(`should receive true if the user created a room`, async () => {
            const results = await pool.query(`SELECT * FROM room WHERE user_id = 1`);
            usersRoomId = results.rows[0].id;
            existingDeleteRoomUrl = `/rooms/${usersRoomId}/delete`
            expect(results.rows.length > 0).toEqual(true);
        });
        /* Done Creating Room */

        /* User doesn't own the room */
        // SAD 
        test(`should redirect to ${unAuthorizedRoomRedirect} if failed - user doesn't own this room`, async () => {
            const response = await authenticatedSession.get(nonExistingDeleteRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })
        // SAD
        test(`should redirect to ${unAuthorizedRoomRedirect} if failed - user doesn't own this room`, async () => {
            const response = await authenticatedSession.delete(nonExistingDeleteRoomUrl).type('form');
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })

        // HAPPY - user owns the room 
        test(`should get a statusCode: 200 if successful`, async () => {
            const response = await authenticatedSession.get(existingDeleteRoomUrl);
            expect(response.statusCode).toEqual(200);
        })
        // HAPPY - checking that the room exists
        test(`should receive true if the user created a room and the room still exists`, async () => {
            const results = await pool.query(`SELECT * FROM room WHERE user_id = 1`);
            expect(results.rows.length > 0).toEqual(true);
        });

        // HAPPY - user owns the room 
        test(`should redirect to ${successfulDeleteRoomRedirect} if successful delete `, async () => {
            const response = await authenticatedSession.delete(existingDeleteRoomUrl).type('form');
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(successfulDeleteRoomRedirect);
        })

        // HAPPY - checking that the room does NOT exist
        test(`should receive FALSE if the room was successfully DELETED`, async () => {
            const results = await pool.query(`SELECT * FROM room WHERE user_id = 1`);
            expect(results.rows.length > 0).toEqual(false);
        });
    });

    // SAD
    describe('Given the user is NOT Authenticated', () => {
        test(`should get a statusCode: 302 & redirect to: ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.get(existingDeleteRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test(`should redirect to ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.delete(existingDeleteRoomUrl).type('form');
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });
    });
});