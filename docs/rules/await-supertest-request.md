# `await-supertest-request`

Verlangt, dass jede HTTP-Anfrage eines [supertest](https://github.com/ladjs/supertest)-Clients direkt mit `await` abgewartet wird.

```js
const testee = supertest(app);              // app ist die Express-App
const response = testee.post('/users');     // Falsch! Muss sofort abgewartet werden
const response = await testee.post('/users');   // Richtig
```

## Warum ist das wichtig?

Eine supertest-Anfrage ist kein fertiges Ergebnis, sondern ein Objekt, das erst beim Abwarten arbeitet. Die Anfrage wird erst gesendet, wenn das Ergebnis mit `await` oder `then()` verarbeitet wird. Auch die Prüfungen aus `.expect(...)` laufen erst dann.

Ohne `await` passiert deshalb Folgendes:

- Der Test läuft weiter, bevor die Antwort da ist. Zugriffe wie `response.status` oder `response.body` liefern `undefined`.
- Fehlschlagende `.expect(...)`-Prüfungen werden nicht oder erst nach dem Testende ausgewertet. Der Test ist dann ein **False-Positive**.
- Fehler tauchen manchmal erst in einem späteren, völlig unbeteiligten Test auf, was die Suche sehr mühsam macht.

## Regeldetails

Die Regel arbeitet in drei Schritten:

1. **Client erkennen:** Ein Client ist das Ergebnis von `supertest(app)`, `supertest.agent(app)` oder `agent(app)` (siehe [Erkannte Clients](#erkannte-clients)).
2. **Anfrage erkennen:** Eine Anfrage ist ein HTTP-Methodenaufruf auf dem Client, z. B. `testee.post('/users')`. Erkannt werden `get`, `post`, `put`, `patch`, `delete`, `del`, `head`, `options`, `trace`, `connect` und `search`.
3. **Aufrufkette prüfen:** Die Kette (`.send()`, `.set()`, `.expect()`, …) wird bis zum äußersten Aufruf verfolgt. Dieser äußerste Aufruf muss direkt das Argument eines `await` sein.

### Falsch

```js
// Die Antwort wird einer Variablen zugewiesen, ohne sie abzuwarten
const response = testee.post('/users');
expect(response.status).toBe(201);

// Die Anfrage wird gar nicht abgewartet, expect() prüft nichts
testee.get('/users').expect(200);

// then() ersetzt await nicht, das Promise geht verloren
testee.get('/users').then((response) => {
    expect(response.status).toBe(200);
});

// Zu spät... die Anfrage muss sofort abgewartet werden
const pending = testee.get('/users');
await pending;
```

### Richtig

```js
// Direkt abgewartet
const response = await testee.post('/users');

// Auch mit langer Aufrufkette
const response = await testee
    .post('/users')
    .send({ name: 'Ada' })
    .set('Accept', 'application/json')
    .expect(201);
```

## Erkannte Clients

Variablen werden mit dem Scope-Manager von ESLint aufgelöst. Dadurch werden Schattierungen und spätere Zuweisungen richtig behandelt. Als supertest gelten:

```js
import supertest from 'supertest';                 // Default-Import (beliebiger Name)
import * as request from 'supertest';              // Namespace-Import
import { agent } from 'supertest';                 // benannter Import agent(app)

const testee = supertest(app);                     // Client
const agent = supertest.agent(app);                // Client mit Cookie-Speicher
const alias = supertest;                           // Alias, alias(app) ist ebenfalls ein Client

let testee;
beforeEach(() => { testee = supertest(app); });    // später zugewiesener Client
```

Nicht erkannt werden Clients, die über eigene Hilfsfunktionen erzeugt werden (`const testee = createClient()`), über `this.client`-Eigenschaften laufen oder per Destructuring aus `require('supertest')` stammen. Aufrufe wie `cache.get('key')` oder `app.get('/users', handler)` werden nicht gemeldet, weil `cache` und `app` keine supertest-Clients sind.

## Konfiguration

Alle Optionen sind optional und werden als ein Objekt übergeben:

```js
// eslint.config.js
export default [
    ...
    {
        ...
        rules: {
            'we2b/jest/await-supertest-request': ['error', {
                allowCallbackStyle: true,
                allowReturn: false,
            }],
        },
        ...
    },
];
```

## Optionen

| Option | Typ | Standard |
|---|---|---|
| [`allowCallbackStyle`](#allowcallbackstyle) | `boolean` | `true` |
| [`allowReturn`](#allowreturn) | `boolean` | `false` |

### `allowCallbackStyle`

Standard: `true`

Beim Callback-Stil beendet die Anfrage sich selbst, ein `await` ist dann nicht nötig. Ist die Option aktiv, werden diese Fälle nicht gemeldet:

- `.end(...)` in der Aufrufkette
- `.expect(..., done)` oder `.expect(..., () => { ... })` mit einem Callback als letztem Argument

Mit `false` müssen auch diese Anfragen mit `await` abgewartet werden.

```js
// allowCallbackStyle: true (Standard)

// Richtig: die Anfrage beendet sich selbst
test('liefert alle Nutzer', (done) => {
    supertest(app).get('/users').expect(200, done);
});

test('liefert alle Nutzer', (done) => {
    supertest(app)
        .get('/users')
        .expect(200)
        .end((err, res) => {
            done(err);
        });
});
```

```js
// allowCallbackStyle: false

// Falsch
test('liefert alle Nutzer', (done) => {
    supertest(app).get('/users').expect(200, done);
});
```

> Hinweis: Bei `.expect(status, body)` ist das zweite Argument kein Callback. Als Callback zählen nur Funktionen und ein Bezeichner mit dem Namen `done`.

### `allowReturn`

Standard: `false`

Wenn aktiviert, darf die Anfrage zurückgegeben statt abgewartet werden. Jest wartet dann auf das zurückgegebene Promise.

Standardmäßig ist das aus, weil die Regel verlangt, dass die Anfrage *direkt* abgewartet wird. Ein `return` sorgt außerdem dafür, dass nach der Anfrage nichts mehr ausgeführt wird.

```js
// allowReturn: true

// Richtig
test('liefert alle Nutzer', () => {
    return supertest(app).get('/users').expect(200);
});

test('liefert alle Nutzer', () => supertest(app).get('/users').expect(200));
```

```js
// allowReturn: false (Standard)

// Falsch
test('liefert alle Nutzer', () => {
    return supertest(app).get('/users').expect(200);
});

// Richtig
test('liefert alle Nutzer', async () => {
    await supertest(app).get('/users').expect(200);
});
```

## Wann sollte man die Regel nicht verwenden?

- Wenn deine Tests Anfragen bewusst parallel starten und erst später gesammelt abwarten (`Promise.all`). Die Regel meldet das, weil sie verlangt, dass jede Anfrage direkt abgewartet wird.
- Wenn die Supertest-Clients in eigenen Hilfsfunktionen erzeugt werden. Solche Clients werden nicht erkannt und nicht geprüft.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.