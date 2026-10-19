import { validExpressEndpoint } from '../../../src/rules/express/valid-express-endpoint';
import { ruleTester } from "../../RuleTester";

/**
 * Testing guidelines taken from eslint docs.
 * https://eslint.org/docs/latest/integrate/nodejs-api#ruletester
 */

ruleTester.run('valid-express-endpoint', validExpressEndpoint, {
    valid: [
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.send('Hello');
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.status(200).status(201).send('Hello');
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res) => {
                    res.send('Created');
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res, next) => {
                    next();
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.status(200).json({ data: [] });
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, _next) {
                    res.send('Hello');
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.status(200).send('Hello');
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, _next) {
                    if(true){
                        res.send();
                        return;
                    } else {
                        res.send();
                        return;
                    }
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, _next) {
                    try {
                        res.send("Okkie Dokkie");
                        return;
                    } catch {
                        res.status(400).send("Bad Request!");
                        return;
                    }
                });
            `,
        },
        {
            // the handler has to declare `next`, otherwise `next(err)` is not the express next function
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        res.send("Okkie Dokkie");
                        return;
                    } catch(err) {
                        next(err);
                        return;
                    }
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function (req, res, _next) {
                    const fruit = "Papayas";
                    switch (fruit) {
                        case "Oranges":
                            res.send("Oranges");
                            return;
                        case "Mangoes":
                        case "Papayas":
                            res.send("Mangoes or Papayas");
                            return;
                        default:
                            res.send("42");
                            return;
                    }
                });
            `,
        },
        // {
        //     code: `
        //         import express from 'express';
        //         const app = express();
        //         app.get('/users', function(req, res, next) {
        //             try {
        //                 res.send("Success");
        //                 return;
        //             } catch(err) {
        //                 res.status(500).send("Error");
        //                 return;
        //             } finally {
        //                 console.log("Cleanup");
        //             }
        //         });
        //     `,
        // },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        const data = processData();
                        res.json(data);
                        return;
                    } catch(err) {
                        next(err);
                        return;
                    }
                });
            `,
        },
        // ---- formerly invalid: the last statement of the handler does not need a return
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.send('Hello');
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res, next) => {
                    next();
                });
            `,
        },
        // ---- formerly invalid (tooManyResponses): code after a return is unreachable and not checked
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.send('First');
                    return;
                    res.send('Second');
                    return;
                });
            `,
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res) => {
                    res.status(200).send('OK');
                    return;
                    res.send('Another');
                    res.json({ data: [] });
                });
            `,
        },
        // ---- callbacks inside a handler are not handlers themselves, so they may be one-liners
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    db.query('SELECT * FROM users', (err, rows) => res.json(rows));
                });
            `,
        },
    ],
    invalid: [
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    return;
                });
            `,
            errors: [{ messageId: "missingTerminationAtReturn" }],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.status(200);
                    return;
                });
            `,
            errors: [{ messageId: "missingTerminationAtReturn" }],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    if (req.profId) {
                        return;
                    }
                    res.send('OK');
                    return;
                });
            `,
            errors: [
                { messageId: "missingTerminationAtReturn" }
            ],
        },
        {
            // not the last statement -> needs a return
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.send('Hello');
                    console.log('Not the last statement');
                });
            `,
            errors: [{ messageId: "missingReturn" }],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res, next) => {
                    next();
                    console.log('Not the last statement');
                });
            `,
            errors: [{ messageId: "missingReturn" }],
        },
        {
            // `next` is not a parameter of the handler, so it is not the express next function
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res) => {
                    next();
                });
            `,
            errors: [{ messageId: "missingTerminationAtEnd" }],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    console.log('No send');
                });
            `,
            errors: [{ messageId: "missingTerminationAtEnd" }],
        },
        {
            // only the first call needs the return, the second one is the last statement
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res) => {
                    res.status(200).send('OK');
                    res.send('Another');
                });
            `,
            errors: [
                { messageId: "missingReturn" }
            ],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.post('/users', (req, res) => {
                    res.status(200);
                });
            `,
            errors: [
                { messageId: "missingTerminationAtEnd" }
            ],
        },
        {
            // falls through into the next case, so the call needs a return
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function (req, res, _next) {
                    const fruit = "Papayas";
                    switch (fruit) {
                        case "Oranges":
                            res.send("Oranges");
                        case "Mangoes":
                        case "Papayas":
                            res.send("Mangoes or Papayas");
                            return;
                        default:
                            res.send("42");
                            return;
                    }
                });
            `,
            errors: [
                { messageId: "missingReturn" },
            ],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function (req, res, _next) {
                    const fruit = "Papayas";
                    switch (fruit) {
                        case "Oranges":
                            res.send("Oranges");
                            return;
                        case "Mangoes":
                        case "Papayas":
                            res.send("Mangoes or Papayas");
                            return;
                        default:
                            return;
                    }
                });
            `,
            errors: [
                { messageId: "missingTerminationAtReturn" },
            ],
        },
        {
            // "Papayas" falls through into "default" -> needs a return
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function (req, res, _next) {
                    const fruit = "Papayas";
                    switch (fruit) {
                        case "Oranges":
                            res.send("Oranges");
                            return;
                        case "Mangoes":
                        case "Papayas":
                            res.send("Mangoes or Papayas");
                        default:
                            res.send("42");
                            return;
                    }
                });
            `,
            errors: [
                { messageId: "missingReturn" },
            ],
        },
        {
            // the first call is followed by another call instead of a return
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function (req, res, _next) {
                    const fruit = "Papayas";
                    switch (fruit) {
                        case "Oranges":
                            res.send("Oranges");
                            res.send("Oranges");
                            return;
                        case "Mangoes":
                        case "Papayas":
                            res.send("Mangoes or Papayas");
                            return;
                        default:
                            res.send(42);
                            return;
                    }
                });
            `,
            errors: [
                { messageId: "missingReturn" },
            ],
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => {
                    res.status(420).status(203);
                });
            `,
            errors: [
                { messageId: "missingTerminationAtEnd" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, _next) {
                    try {
                        res.send("Okkie Dokkie");
                        return;
                    } catch(err) {

                    }
                });
            `,
            errors: [
                { messageId: "missingTerminationAtEnd" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        res.send("Success");
                        return;
                    } catch(err) {
                        console.log(err);
                    }
                });
            `,
            errors: [
                { messageId: "missingTerminationAtEnd" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        processData();
                    } catch(err) {
                        res.status(500).send("Error");
                        return;
                    }
                });
            `,
            errors: [
                { messageId: "missingTerminationAtEnd" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => res.send('Einzeiler'));
            `,
            errors: [
                { messageId: "missingBlockStatement" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res, next) => next());
            `,
            errors: [
                { messageId: "missingBlockStatement" }
            ]
        },
        {
            // a one-liner that does not respond is reported twice
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', (req, res) => console.log('No send'));
            `,
            errors: [
                { messageId: "missingBlockStatement" },
                { messageId: "missingTerminationAtEnd" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        res.send("Success");
                        return;
                    } catch(err) {
                        res.status(500).send("Error");
                        return;
                    } finally {
                        res.send("Cleanup");
                        return;
                    }
                });
            `,
            errors: [
                { messageId: "finallyHasSend" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        const data = processData();
                        res.json(data);
                        return;
                    } finally {
                        res.send("Done");
                        return;
                    }
                });
            `,
            errors: [
                { messageId: "finallyHasSend" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        res.send("Success");
                        return;
                    } finally {
                        next();
                        return;
                    }
                });
            `,
            errors: [
                { messageId: "finallyHasSend" }
            ]
        },
        {
            // code that follows in a finally block runs after the try block, so the call needs a return
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        res.send("Success");
                    } finally {
                        console.log("Cleanup");
                    }
                });
            `,
            errors: [
                { messageId: "missingReturn" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        const data = processData();
                        res.json(data);
                    } catch(err) {
                        next(err);
                    } finally {
                        console.log("Cleanup");
                    }
                });
            `,
            errors: [
                { messageId: "missingReturn" },
                { messageId: "missingReturn" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/users', function(req, res, next) {
                    try {
                        processData();
                    } catch(err) {
                        console.log(err);
                    }
                });
            `,
            errors: [
                { messageId: "missingTerminationAtEnd" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/error', (req, res) => {
                    res.sendStatus(400).send('Bad Request');
                    return;
                });
            `,
            errors: [
                { messageId: "multipleSendInChain" }
            ]
        },
        {
            code: `
                import express from 'express';
                const app = express();
                app.get('/error', (req, res) => {
                    res.sendStatus(400).json({ error: 'Bad' }).send('Also Bad');
                    return;
                });
            `,
            errors: [
                { messageId: "multipleSendInChain" },
                { messageId: "multipleSendInChain" }
            ]
        },
    ],
});