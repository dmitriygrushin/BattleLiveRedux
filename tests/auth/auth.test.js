const request = require('supertest');
const app = require('../../app');
const { pool } = require('../../dbConfig');

afterAll(async () => {
    await pool.query(`DELETE FROM user_account WHERE email = 'testEmail@gmail.com'`); // clean up db to test again
    pool.end();
});

const loginUrl = '/users/login';
const userEmail = 'loginTestUser@gmail.com';
const userRealPassword = '123456';
const successfulLoginUrl = '/users/dashboard';

describe('Authentication: Login | POST /users/login', () => {
    const failedLoginUrl = '/users/login';
    const userFakePassword = '_fakePassword';

    describe('Given a username and password', () => {
        // HAPPY
        test(`should redirect to ${successfulLoginUrl} if login SUCCEEDED`, async () => {
            const response = await request(app).post(loginUrl).type('form').send({
                email: userEmail,
                password: userRealPassword // correct password
            })
            //console.log(util.inspect(response.headers, {showHidden: false, depth: null, colors: true}))
            
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(successfulLoginUrl);
        });

        // SAD
        test(`should redirect to ${failedLoginUrl} if login FAILED - wrong email or password`, async () => {
            const response = await request(app).post(loginUrl).type('form').send({
                email: userEmail,
                password: userFakePassword
            });
            
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(failedLoginUrl);
        });

        // SAD
        test(`should redirect to ${failedLoginUrl} if login FAILED - empty form`, async () => {
            const response = await request(app).post(loginUrl).type('form').send({ });
            
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(failedLoginUrl);
        });

    });

});

describe('Authentication: Register | POST /users/register', () => {

    describe('Given Username, Email, and Password', () => {
        const testUsername = 'testUser';
        const testEmail = 'testEmail@gmail.com';
        const testPassword = 'testPassword';

        const registerUrl = '/users/register';
        const successfulRegisterUrl = '/users/login';
        const failedRegisterUrl = '/users/register';

        // HAPPY
        test(`should redirect to ${successfulRegisterUrl} if registration SUCCEEDED`, async () => {
            const response = await request(app).post(registerUrl).type('form').send({
                username: testUsername, 
                email: testEmail,
                password: testPassword, 
                password2: testPassword
            });
            expect(response.statusCode).toEqual(302);
            expect(response.headers.location).toEqual(successfulRegisterUrl);
        });

        // SAD - by this point the testUser has already been registered by the HAPPY test
        test(`should redirect to ${failedRegisterUrl} if registration FAILED - used already exists`, async () => {
            const response = await request(app).post(registerUrl).type('form').send({
                username: testUsername, 
                email: testEmail,
                password: testPassword,
                password2: testPassword
            })
            expect(response.statusCode).toEqual(200); 
        });

        // SAD - by this point the testUser has already been registered by the HAPPY test - using an existing EMAIL
        test(`should redirect to ${failedRegisterUrl} if registration FAILED - used already exists`, async () => {
            const response = await request(app).post(registerUrl).type('form').send({
                username: 'nonExistingUsername', 
                email: testEmail, // this email is already in use
                password: testPassword,
                password2: testPassword
            })
            expect(response.statusCode).toEqual(200); 
        });

        // SAD - by this point the testUser has already been registered by the HAPPY test - using an existing USERNAME
        test(`should redirect to ${failedRegisterUrl} if registration FAILED - used already exists`, async () => {
            const response = await request(app).post(registerUrl).type('form').send({
                username: testUsername, // this username is already in use
                email: 'nonExistingEmail@gmail.com',
                password: testPassword,
                password2: testPassword
            })
            expect(response.statusCode).toEqual(200); 
        });

        // SAD
        test(`should redirect to ${failedRegisterUrl} if registration FAILED - used already exists`, async () => {
            const response = await request(app).post(registerUrl).type('form').send({ })
            expect(response.statusCode).toEqual(422); 
        });
    });
});