process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const session = require('supertest-session');
const myApp = require('../../app');
const { pool } = require('../../dbConfig');

const testAccount = { email:  'loginTestUser@gmail.com', password: '123456' };

const loginUrl = '/users/login',
    notAuthenticatedRedirect = '/users/login';

const createRoomUrl = '/rooms/create';

const successfulCreateRoomRedirect = '/users/dashboard', 
    successfulEditRoomRedirect = '/users/dashboard', 
    successfulLoginRedirect = '/users/dashboard';

const unAuthorizedRoomRedirect = '/';

const nonExistingEditRoomUrl = '/rooms/0/edit';
let usersRoomId;
let existingEditRoomUrl;

const completeCreateRoomFormObj = { description: 'generic create description from edit test' },
    completeEditRoomFormObj = { description: 'generic edit from edit test' },
    inCompleteEditRoomFormObj = { description: '' },
    undefinedCompleteEditRoomFormObj = { };

let basicSession = null;
 
beforeEach(() => {
    basicSession = session(myApp);
});

afterAll(async () => {
    await pool.query(`DELETE FROM room WHERE user_id = 1`); // clean up db to test again
    pool.end();
});

describe('Room CRUD: Edit | POST /rooms/:id/edit', () => {
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
            const response = await authenticatedSession.get(nonExistingEditRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })

        // SAD
        test(`should redirect to ${unAuthorizedRoomRedirect} if PUT failed`, async () => {
            const response = await authenticatedSession.put(nonExistingEditRoomUrl).type('form').send(completeEditRoomFormObj);
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
            existingEditRoomUrl = `/rooms/${usersRoomId}/edit`
            expect(results.rows.length > 0).toEqual(true);
        });
        /* Done Creating Room */

        /* User doesn't own the room */
        // SAD 
        test(`should redirect to ${unAuthorizedRoomRedirect} if failed - user doesn't own this room`, async () => {
            const response = await authenticatedSession.get(nonExistingEditRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })
        // SAD
        test(`should redirect to ${unAuthorizedRoomRedirect} if failed - user doesn't own this room`, async () => {
            const response = await authenticatedSession.put(nonExistingEditRoomUrl).type('form').send(completeEditRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(unAuthorizedRoomRedirect);
        })

        // HAPPY - user owns the room 
        test(`should get a statusCode: 200 if successful`, async () => {
            const response = await authenticatedSession.get(existingEditRoomUrl);
            expect(response.statusCode).toEqual(200);
        })

        // HAPPY - user owns the room 
        test(`should redirect to ${successfulEditRoomRedirect} if successful edit `, async () => {
            const response = await authenticatedSession.put(existingEditRoomUrl).type('form').send(completeEditRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(successfulEditRoomRedirect);
        })

        // SAD - user owns the room - undefined form
        test(`should redirect to ${successfulEditRoomRedirect} if successful edit `, async () => {
            const response = await authenticatedSession.put(existingEditRoomUrl).type('form').send(undefinedCompleteEditRoomFormObj);
            expect(response.statusCode).toEqual(422);
        })

        // SAD - user owns the room - incomplete form
        test(`should redirect to ${successfulEditRoomRedirect} if successful edit `, async () => {
            const response = await authenticatedSession.put(existingEditRoomUrl).type('form').send(inCompleteEditRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(existingEditRoomUrl);
        })

        // HAPPY - testing if the room description changed
        test(`should receive true if the user edited the room description`, async () => {
            const results = await pool.query(`SELECT * FROM room WHERE user_id = 1`);
            const newDescription = results.rows[0].description;
            expect(newDescription != completeCreateRoomFormObj.description).toEqual(true);
            expect(newDescription === completeEditRoomFormObj.description).toEqual(true);
        });
    });

    // SAD
    describe('Given the user is NOT Authenticated', () => {
        test(`should get a statusCode: 302 & redirect to: ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.get(existingEditRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test(`should redirect to ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.put(existingEditRoomUrl).type('form').send(undefinedCompleteEditRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test(`should redirect to ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.put(existingEditRoomUrl).type('form').send(inCompleteEditRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test(`should redirect to ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.put(existingEditRoomUrl).type('form').send(completeEditRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });
    });
});