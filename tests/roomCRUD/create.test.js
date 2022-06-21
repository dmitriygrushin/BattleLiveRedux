const session = require('supertest-session');
const myApp = require('../../app');
const { pool } = require('../../dbConfig');

const testAccount = { email:  'loginTestUser@gmail.com', password: '123456' }

const loginUrl = '/users/login',
    notAuthenticatedRedirect = '/users/login';

const createRoomUrl = '/rooms/create',
    createRoomUrlIncForm = '/rooms/create';

const successfulCreateRoomRedirect = '/users/dashboard', 
    successfulLoginRedirect = '/users/dashboard';

const userAlreadyCreatedRoomRedirect = '/';

const completeCreateRoomFormObj = {description: 'generic description from create test'};

let basicSession = null;
 
beforeEach(() => {
    basicSession = session(myApp);
});

afterAll(async () => {
    await pool.query(`DELETE FROM room WHERE user_id = 1`); // clean up db to test again
    pool.end();
});

describe('Room CRUD: Create | POST /rooms/create', () => {
    // SAD
    describe('Given the user is NOT Authenticated', () => {
        test(`should get a statusCode: 302 & redirect to: ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.get(createRoomUrl);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test(`should redirect to ${notAuthenticatedRedirect}`, async () => {
            const response = await basicSession.post(createRoomUrl).type('form').send(completeCreateRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });

        test('should redirect to /users/login', async () => {
            const response = await basicSession.post(createRoomUrl).type('form').send({});
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(notAuthenticatedRedirect);
        });
    });

    describe('Given the user is Authenticated', () => {
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
    
        // HAPPY
        test('should get a statusCode: 200', async () => {
            const response = await authenticatedSession.get(createRoomUrl);
            expect(response.statusCode).toEqual(200);
        });

        // SAD
        test('should get a statusCode: 422 - undefined form - if unsuccessful', async () => {
            const response = await authenticatedSession.post(createRoomUrl).type('form').send({});
            expect(response.statusCode).toEqual(422);
        });

        // SAD
        test(`should redirect to ${createRoomUrlIncForm} - empty form - if unsuccessful`, async () => {
            const response = await authenticatedSession.post(createRoomUrl).type('form').send({description: ''});
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(createRoomUrlIncForm);
        });

        // HAPPY - testing if the user didn't create a room - all attempts should be successfully unsuccessful
        test(`should receive false if the user didn't create a room`, async () => {
            const results = await pool.query(`SELECT * FROM room WHERE user_id = 1`);
            expect(results.rows.length > 0).toEqual(false);
        });

        // HAPPY
        test(`should redirect to ${successfulCreateRoomRedirect} - complete form`, async () => {
            const response = await authenticatedSession.post(createRoomUrl).type('form').send(completeCreateRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(successfulCreateRoomRedirect);
        });

        // HAPPY - testing if the user created a room
        test(`should receive true if the user created a room`, async () => {
            const results = await pool.query(`SELECT * FROM room WHERE user_id = 1`);
            expect(results.rows.length > 0).toEqual(true);
        });

        // SAD
        test(`should redirect to ${userAlreadyCreatedRoomRedirect} - complete form but a room from this user exists`, async () => {
            const response = await authenticatedSession.post(createRoomUrl).type('form').send(completeCreateRoomFormObj);
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(userAlreadyCreatedRoomRedirect);
        });
    });
});
