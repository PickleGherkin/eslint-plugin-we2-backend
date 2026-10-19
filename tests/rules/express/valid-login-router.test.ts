import { validLoginRouter } from "../../../src/rules/express/valid-login-router";
import { ruleTester } from "../../RuleTester";

ruleTester.run("valid-login-router", validLoginRouter, {
    valid: [
        {
            code: `
                import express from 'express';
                import { verifyPasswordAndCreateJWT } from 'JWTService'

                const loginRouter = express.Router();
                loginRouter.get('/users',
                body('campusID').isString().isLength({ min: 1, max: 100 }),
                body('password').isStrongPassword(),
                (req, res) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        res.status(400).send({ errors: errors.array() })
                        return;
                    }

                    const campusID = req.body.campusID;
                    const password = req.body.password;

                    const loginResult = await verifyPasswordAndCreateJWT(campusID, password);
                    const loginRes = verifyJWT(loginResult);
                });
            `,
        },
        {
            code: `
                import express from 'express';
                import { verifyPasswordAndCreateJWT } from 'JWTService'

                const andererRouter = express.Router();
                andererRouter.get('/users',
                (req, res) => {
                    const campusID = req.body.campusID;
                    const password = req.body.password;

                    const wrong1 = await login(campusID, password);
                    const wrong2 = verify(var1);
                    const wrong3 = bcrypt.compare(var1, var2);
                });
            `,
        }
    ],
    invalid: [
        {
            code: `
                import express from 'express';

                const loginRouter = express.Router();
                loginRouter.get('/users',
                body('campusID').isString().isLength({ min: 1, max: 100 }),
                body('password').isStrongPassword(),
                (req, res) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        res.status(400).send({ errors: errors.array() })
                        return;
                    }

                    const campusID = req.body.campusID;
                    const password = req.body.password;

                    const prof = await Prof.findOne({campusID: campusID}).exec();
                    if (!prof){
                        res.status(400).send("Bad Request!");
                    }
                    const loginResult = await bcrypt.compare(password, prof.password)
                });
            `,
            errors: [{ messageId: "noBcrypt" }],
        },
        {
            code: `
                import express from 'express';

                const loginRouter = express.Router();
                loginRouter.get('/users',
                body('campusID').isString().isLength({ min: 1, max: 100 }),
                body('password').isStrongPassword(),
                (req, res) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        res.status(400).send({ errors: errors.array() })
                        return;
                    }

                    const campusID = req.body.campusID;
                    const password = req.body.password;

                    const prof = await Prof.findOne({campusID: campusID}).exec();
                    if (!prof){
                        res.status(400).send("Bad Request!");
                    }
                    const loginResult = await verifyPasswordAndCreateJWT(password, prof.password)
                    const loginRes = verify(loginResult, secret);
                });
            `,
            errors: [{ messageId: "noVerify" }],
        },
        {
            code: `
                import express from 'express';

                const loginRouter = express.Router();
                loginRouter.get('/users',
                (req, res) => {
                    const loginRes = jwt.verify(loginResult, secret);
                });
            `,
            errors: [{ messageId: "noVerify" }],
        },
        {
            code: `
                import express from 'express';

                const loginRouter = express.Router();
                loginRouter.get('/users',
                (req, res) => {
                    const loginRes = jsonwebtoken.verify(loginResult, secret);
                });
            `,
            errors: [{ messageId: "noVerify" }],
        },
        {
            code: `
                import express from 'express';

                const loginRouter = express.Router();
                loginRouter.post('/',
                (req, res) => {
                    const loginRes = await login(res.body.campusID, res.body.password);
                });
            `,
            errors: [{ messageId: "noLogin" }],
        },
        {
            code: `
                import express from 'express';
                import { verifyPasswordAndCreateJWT } from 'JWTService'

                const loginRouter = express.Router();
                loginRouter.get('/users',
                (req, res) => {
                    const campusID = req.body.campusID;
                    const password = req.body.password;

                    const wrong1 = await login(campusID, password);
                    const wrong2 = verify(var1);
                    const wrong3 = bcrypt.compare(var1, var2);
                });
            `,
            errors: [{ messageId: "noLogin" }, { messageId: "noVerify" }, { messageId: "noBcrypt" }],
        },
        {
            code: `
                import express from 'express';
                import { compare } from 'bcrypt';

                const loginRouter = express.Router();
                loginRouter.post('/',
                (req, res) => {
                    const loginRes = compare(var1, var2);
                });
            `,
            errors: [{ messageId: "noBcrypt" }],
        },
    ]
})