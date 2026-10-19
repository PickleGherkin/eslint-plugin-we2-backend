import awaitSupertestRequest from "../../../src/rules/jest/await-supertest-request";
import { ruleTester } from "../../RuleTester";

/**
 * Testing guidelines taken from eslint docs.
 * https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
 *
 * Message ids:
 *  - notAwaited:           the request is not awaited at all (statement, argument, .then(), ...)
 *  - assignedWithoutAwait: the request is assigned to a variable without `await`
 */
ruleTester.run('await-supertest-request', awaitSupertestRequest, {
    valid: [
        // ---- the request is awaited right away
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('legt einen Nutzer an', async () => {
                    const testee = supertest(app);
                    const response = await testee.post('/users');
                    expect(response.status).toBe(201);
                });
            `,
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('legt einen Nutzer an', async () => {
                    const testee = supertest(app);
                    const response = await testee
                        .post('/users')
                        .send({ name: 'Ada' })
                        .set('Accept', 'application/json')
                        .expect(201);
                    expect(response.body.name).toBe('Ada');
                });
            `,
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    await supertest(app).get('/users').expect(200);
                });
            `,
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert den Body', async () => {
                    const testee = supertest(app);
                    const { body } = await testee.get('/users');
                    const status = (await testee.get('/users')).status;
                    expect(body).toEqual([]);
                    expect(status).toBe(200);
                });
            `,
        },
        // ---- other ways to import supertest and other names
        {
            code: `
                import request from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    await request(app).get('/users').expect(200);
                });
            `,
        },
        {
            code: `
                import * as request from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    await request(app).get('/users').expect(200);
                });
            `,
        },
        {
            code: `
                const request = require('supertest');
                const { app } = require('../app');

                test('liefert alle Nutzer', async () => {
                    await request(app).get('/users').expect(200);
                });
            `,
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('bleibt eingeloggt', async () => {
                    const agent = supertest.agent(app);
                    await agent.post('/login').send({ name: 'Ada' }).expect(200);
                    await agent.get('/profile').expect(200);
                });
            `,
        },
        {
            // the client is assigned later, e.g. in a beforeEach hook
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                let testee;

                beforeEach(() => {
                    testee = supertest(app);
                });

                test('liefert alle Nutzer', async () => {
                    await testee.get('/users').expect(200);
                });
            `,
        },
        // ---- calls that look similar but are not supertest requests
        {
            code: `
                import express from 'express';
                import supertest from 'supertest';

                const app = express();
                const cache = new Map();

                app.get('/users', (req, res) => {
                    res.send(cache.get('users'));
                });
            `,
        },
        {
            // the parameter "testee" hides the supertest client of the outer scope
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                const testee = supertest(app);

                function helper(testee) {
                    testee.get('/users');
                }
            `,
        },
        // ---- callback style needs no await (allowCallbackStyle is on by default)
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', (done) => {
                    supertest(app)
                        .get('/users')
                        .expect(200)
                        .end((err, res) => {
                            done(err);
                        });
                });
            `,
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', (done) => {
                    supertest(app).get('/users').expect(200, done);
                });
            `,
        },
        // ---- returning the request is allowed with allowReturn
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', () => {
                    return supertest(app).get('/users').expect(200);
                });
            `,
            options: [{ allowReturn: true }],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', () => supertest(app).get('/users').expect(200));
            `,
            options: [{ allowReturn: true }],
        },
    ],
    invalid: [
        // ---- assigned to a variable without await
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('legt einen Nutzer an', async () => {
                    const testee = supertest(app);
                    const response = testee.post('/users');
                    expect(response.status).toBe(201);
                });
            `,
            errors: [
                {
                    messageId: "assignedWithoutAwait",
                    data: { request: "testee.post(...)", variable: "response" },
                }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('legt einen Nutzer an', async () => {
                    const testee = supertest(app);
                    const response = testee
                        .post('/users')
                        .send({ name: 'Ada' })
                        .expect(201);
                });
            `,
            errors: [
                { messageId: "assignedWithoutAwait" }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    const testee = supertest(app);
                    let response;
                    response = testee.get('/users');
                });
            `,
            errors: [
                {
                    messageId: "assignedWithoutAwait",
                    data: { request: "testee.get(...)", variable: "response" },
                }
            ],
        },
        {
            // awaiting the variable later is too late, the request has to be awaited right away
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    const testee = supertest(app);
                    const pending = testee.get('/users');
                    await pending;
                });
            `,
            errors: [
                {
                    messageId: "assignedWithoutAwait",
                    data: { request: "testee.get(...)", variable: "pending" },
                }
            ],
        },
        {
            // destructuring: there is no single variable name, so "response" is used in the message
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    const testee = supertest(app);
                    const { body } = testee.get('/users');
                });
            `,
            errors: [
                {
                    messageId: "assignedWithoutAwait",
                    data: { request: "testee.get(...)", variable: "response" },
                }
            ],
        },
        // ---- not awaited at all
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    const testee = supertest(app);
                    testee.get('/users').expect(200);
                });
            `,
            errors: [
                {
                    messageId: "notAwaited",
                    data: { request: "testee.get(...)" },
                }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    supertest(app).get('/users').expect(200);
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            code: `
                import request from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    request(app).get('/users').expect(200);
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('bleibt eingeloggt', async () => {
                    const agent = supertest.agent(app);
                    agent.post('/login').send({ name: 'Ada' });
                    await agent.get('/profile').expect(200);
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                let testee;

                beforeEach(() => {
                    testee = supertest(app);
                    testee.post('/login').send({ name: 'Ada' });
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            // then() is no replacement for await: the promise is thrown away
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    const testee = supertest(app);
                    testee.get('/users').then((response) => {
                        expect(response.status).toBe(200);
                    });
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            // the requests are not awaited right away but only as part of Promise.all
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alles', async () => {
                    const testee = supertest(app);
                    await Promise.all([
                        testee.get('/users'),
                        testee.get('/posts'),
                    ]);
                });
            `,
            errors: [
                { messageId: "notAwaited" },
                { messageId: "notAwaited" }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', async () => {
                    const testee = supertest(app);
                    void testee.get('/users');
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        // ---- options
        {
            // returning is not allowed by default
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', () => {
                    return supertest(app).get('/users').expect(200);
                });
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', () => supertest(app).get('/users').expect(200));
            `,
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            // allowCallbackStyle: false -> end() with a callback is reported as well
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', (done) => {
                    supertest(app).get('/users').expect(200).end(done);
                });
            `,
            options: [{ allowCallbackStyle: false }],
            errors: [
                { messageId: "notAwaited" }
            ],
        },
        {
            code: `
                import supertest from 'supertest';
                import { app } from '../app';

                test('liefert alle Nutzer', (done) => {
                    supertest(app).get('/users').expect(200, done);
                });
            `,
            options: [{ allowCallbackStyle: false }],
            errors: [
                { messageId: "notAwaited" }
            ],
        },
    ],
});