process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const session = require('supertest-session');
const myApp = require('../../app');
const { pool } = require('../../dbConfig');

const testAccount = { email:  'loginTestUser@gmail.com', password: '123456' };
const testAccount2 = { email:  'testAccount2@gmail.com', password: '123456' };

const loginUrl = '/users/login',
    notAuthenticatedRedirect = '/users/login';

const createRoomUrl = '/rooms/create';

const successfulCreateRoomRedirect = '/users/dashboard', 
    successfulLoginRedirect = '/users/dashboard',
    nonExistingRoomRedirect = '/users/dashboard';

const nonExistingRoomUrl = '/rooms/0/rapRoom';
let usersRoomId;
let existingRoomUrl; // /rooms/${usersRoomId}/rapRoom

const completeCreateRoomFormObj = { description: 'generic create description from delete test' };

let basicSession = null;
 
beforeEach(() => {
    basicSession = session(myApp);
});

afterAll(async () => {
    await pool.query(`DELETE FROM room WHERE user_id = 1`); // clean up db to test again
    pool.end();
});

describe('Room CRUD: READ  | DELETE /rooms/:id/rapRoom', () => {
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
            existingRoomUrl = `/rooms/${usersRoomId}/rapRoom`
            expect(results.rows.length > 0).toEqual(true);
        });
        /* Done Creating Room */

        // HAPPY
        test(`should get statusCode: 200 - user created and is viewing their room`, async () => {
            const response = await authenticatedSession.get(existingRoomUrl);
            expect(response.statusCode).toEqual(200);
        });

        // SAD
        test(`should get a redirect to ${nonExistingRoomRedirect} if room doesn't exist`, async () => {
            const response = await authenticatedSession.get(nonExistingRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(nonExistingRoomRedirect);
        });
    });


    describe('Given the user is Authenticated', () => {
        let authenticatedSession;
    
        // Authenticate User
        beforeEach((done) => {
            basicSession.post(loginUrl).type('form')
            .send(testAccount2)
            .expect(302) 
            .expect('Location', successfulLoginRedirect)
            .end(function (err) {
                if (err) return done(err);
                authenticatedSession = basicSession; // save the session
                return done();
            });
        });

        // HAPPY
        test(`should get statusCode: 200 - user is viewing another user's room`, async () => {
            const response = await authenticatedSession.get(existingRoomUrl);
            expect(response.statusCode).toEqual(200);
        });

        // SAD
        test(`should get a redirect to ${nonExistingRoomRedirect} if room doesn't exist`, async () => {
            const response = await authenticatedSession.get(nonExistingRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(nonExistingRoomRedirect);
        });
    });

    // SAD
    describe('Given the user is NOT Authenticated', () => {
        test(`should get a statusCode: 302 & redirect to: ${notAuthenticatedRedirect} - room exists`, async () => {
            const response = await basicSession.get(existingRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test(`should get a statusCode: 302 & redirect to: ${notAuthenticatedRedirect} - room doesn't exists`, async () => {
            const response = await basicSession.get(nonExistingRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });
    });
});