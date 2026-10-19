import { noModelDependencies } from "../../../src/rules/express/no-model-dependencies";
import { ruleTester } from "../../RuleTester";

ruleTester.run("no-model-dependencies", noModelDependencies, {
    valid: [
        {
            code: `
                import express from 'express';

                const app = express();

                function loadUser() {
                    return Prof.findOne({ campusID: '4711' });
                }

                app.get('/users', (req, res) => {
                    const user = loadUser();
                    res.status(200).send(user);
                });
            `,
        },
        {
            code: `
                import express from 'express';

                const app = express();

                app.get('/users', (req, res) => {
                    const password = req.body.password;
                    const result = verifyPasswordAndCreateJWT(password, 'secret');
                    res.json(result);
                });
            `,
        }
    ],
    invalid: [
        {
            code: `
                import express from 'express';

                const app = express();

                app.get('/users', (req, res) => {
                    const user = Prof();
                    res.status(200).send(user);
                });
            `,
            errors: [{ messageId: "noModelDependencies" }],
        },
        {
            code: `
                import express from 'express';

                const app = express();

                app.get('/users', (req, res) => {
                    const prof = Prof.findOne({ campusID: req.body.campusID });
                    const region = Gebiet.update({ name: 'Norden' }, { active: true });
                    const topic = Thema.deleteMany({ archived: true });
                    res.status(200).send({ prof, region, topic });
                });
            `,
            errors: [
                { messageId: "noModelDependencies" },
                { messageId: "noModelDependencies" },
                { messageId: "noModelDependencies" },
            ],
        },
    ]
});