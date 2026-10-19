# valid-express-endpoint

Stellt sicher, dass Express-Route-Handler korrekt implementiert werden.

## Regel Details

Diese Regel überprüft Express-Route-Handler auf fünf häufige Fehler:

1. **Fehlende Response**: Jeder Route-Handler muss eine Response senden (`res.send()`, `res.json()`) oder die Anfrage weiterleiten (`next()`)
2. **Mehrfache Responses**: Pro Anfrage darf nur eine Response gesendet werden
3. **Fehlendes `return`**: Nach dem Senden einer Response muss ein `return` folgen, um weitere Code-Ausführung zu verhindern (kann automatisch behoben werden)
4. **Fehlender Funktionsblock**: Express-Handler sollten einen Block mit geschweiften Klammern verwenden
5. **Response im `finally` Block**: `finally` Blöcke sollten keine Responses senden, sondern nur für Aufräumarbeiten verwendet werden

## Warum ist diese Regel wichtig?

### Problem 1: Fehlende Response
Wenn ein Handler keine Response sendet, wartet der Client auf eine Antwort, die niemals abgeschickt wurde. Dies führt zu Timeouts und fehlendem Feedback beim Client.

```javascript
// Client wartet ewig auf Antwort
app.get('/users', (req, res) => {
    const users = getUsers();
    // Vergessen zu senden!
});
```

### Problem 2: Mehrfache Responses
HTTP erlaubt nur eine Response pro Anfrage. Versuche, mehrere Responses zu senden, führen zu Fehlern wie `Error: Cannot set headers after they are sent to the client`.

```javascript
// Zwei Responses - der zweite Aufruf führt zu einem Fehler
app.get('/users', (req, res) => {
    res.send('First');
    res.send('Second'); // Error!
});
```

### Problem 3: Fehlendes `return`
Ohne `return` wird der Code nach dem Senden einer Response weiter ausgeführt. Dies kann zu unerwartetem Verhalten, Sicherheitslücken und schwer zu findenden Bugs führen.

**Hinweis:** Diese Regel bietet einen **Autofix** an, der automatisch ein `return;` nach Response-Aufrufen einfügt.

```javascript
// Code wird nach res.send() weiter ausgeführt
app.get('/admin', (req, res) => {
    if (!user.isAdmin) {
        res.status(403).send('Forbidden');
        // Ohne return läuft der Code weiter!
    }
    // Dieser Code wird trotzdem ausgeführt!
    res.send(sensitiveData);
});
```

### Problem 4: Fehlender Funktionsblock
Express-Handler ohne Funktionsblock (mit geschweiften Klammern) sind schlecht lesbar und erschweren Wartung. Express-Endpoints beinhalten in der Regel Validierung, Fehlerbehandlung und Response-Logik - das lässt sich nicht sinnvoll in einer einzigen Zeile umsetzen.

```javascript
// Ohne Funktionsblock - nicht erlaubt
app.get('/users', (req, res) => res.send('Hello'));

// Mit Funktionsblock - gut
app.get('/users', (req, res) => {
    return res.send('Hello');
});
```

### Problem 5: Response im `finally` Block
Der `finally` Block in einer `try-catch` Anweisung ist dazu gedacht, Aufräumarbeiten durchzuführen, nicht um Responses zu senden. Responses sollten im `try` und `catch` Block gesendet werden.

```javascript
// Falsch - Response im finally
app.get('/data', (req, res) => {
    try {
        const data = fetchData();
        // Vergessen zu senden!
    } catch (error) {
        // Auch hier vergessen!
    } finally {
        res.send('Done'); // Nicht erlaubt!
    }
});

// Korrekt - Responses in try und catch
app.get('/data', (req, res) => {
    try {
        const data = fetchData();
        return res.json(data);
    } catch (error) {
        return res.status(500).send('Error');
    } finally {
        // Nur Aufräumarbeiten
        cleanup();
    }
});
```

## Beispiele

### Falsche Implementationen

```javascript
// Fehlende Response
app.get('/users', (req, res) => {
    const users = getUsers();
    console.log(users);
    // Keine Response!
});

// Mehrfache Responses
app.post('/users', (req, res) => {
    res.status(201).send('Created');
    res.json({ id: 123 }); // Fehler!
});

// Fehlendes return nach Response
app.get('/users', (req, res) => {
    res.send('Hello');
    console.log('Dies wird noch ausgeführt');
});

// Fehlendes return bei bedingter Response
app.get('/admin', (req, res) => {
    if (!isAuthorized(req)) {
        res.status(403).send('Forbidden');
        // Fehlt: return;
    }
    // Dieser Code läuft trotzdem!
    res.send(adminData);
});

// Fehlender Funktionsblock
app.get('/users', (req, res) => res.send('Hello')); // Nicht erlaubt

// Response im finally Block
app.get('/data', (req, res) => {
    try {
        const data = fetchData();
    } catch (error) {
        console.log(error);
    } finally {
        res.send('Done'); // Nicht erlaubt!
    }
});

// Switch-Case mit fehlender Response im default-Case
app.get('/status', (req, res) => {
    switch (req.query.type) {
        case 'health':
            res.send('OK');
            return;
        default:
            return; // Keine Response!
    }
});
```

### Korrekte Implementationen

```javascript
// Response mit return
app.get('/users', (req, res) => {
    return res.send('Hello');
});

// Alternative: Response, dann return
app.get('/users', (req, res) => {
    res.send('Hello');
    return;
});

// Bedingte Responses mit return
app.get('/users', (req, res) => {
    if (!isAuthenticated(req)) {
        res.status(401).send('Unauthorized');
        return;
    }
    
    return res.json({ users: getUsers() });
});

// If/Else mit Responses in beiden Zweigen
app.get('/data', (req, res) => {
    if (condition) {
        res.send('A');
        return;
    } else {
        res.send('B');
        return;
    }
});

// Verwendung von next() für Middleware
app.get('/users', (req, res, next) => {
    if (!req.user) {
        return next(); // Weiterleiten an nächste Middleware
    }
    return res.json(req.user);
});

// Fehlerbehandlung mit next()
app.get('/users', (req, res, next) => {
    try {
        const users = getUsers();
        return res.json(users);
    } catch (error) {
        return next(error); // Fehler an Error-Handler weitergeben
    }
});

// Switch-Case mit Response in allen Fällen
app.get('/status', (req, res) => {
    switch (req.query.type) {
        case 'health':
            res.send('OK');
            return;
        case 'ready':
            res.send('Ready');
            return;
        default:
            res.send('Unknown');
            return;
    }
});

// Try/Catch mit korrekter Fehlerbehandlung
app.get('/data', (req, res, next) => {
    try {
        const data = fetchData();
        return res.json(data);
    } catch (error) {
        return next(error);
    }
});
```

## Best Practices

### 1. Verwende immer `return` nach Response-Aufrufen

```javascript
// Gut
app.get('/users', (req, res) => {
    return res.json(users); // return macht die Intention klar
});

// Auch gut
app.get('/users', (req, res) => {
    res.json(users);
    return; // Explizit die Funktion verlassen
});
```

### 2. Behandle alle Code-Pfade

```javascript
// Alle Pfade haben eine Response
app.get('/data', (req, res) => {
    if (condition) {
        return res.send('A');
    }
    return res.send('B'); // Auch der else-Fall ist abgedeckt
});
```

### 3. Fehlerbehandlung mit next()

```javascript
// Fehler werden weitergegeben
app.get('/data', (req, res, next) => {
    try {
        const result = riskyOperation();
        return res.json(result);
    } catch (error) {
        return next(error); // Express Error-Handler übernimmt
    }
});
```

### 4. Verwende Funktionsblöcke

```javascript
// Funktionsblock für bessere Lesbarkeit
app.get('/users', (req, res) => {
    // Hier ist Platz für:
    // - Validierung
    // - Datenbank-Abfragen
    // - Fehlerbehandlung
    // - Response-Logik
    return res.json(users);
});
```

## Häufige Fehlerquellen

### 1. Fall-Through in Switch-Statements

```javascript
// Vergessener break/return
app.get('/status', (req, res) => {
    switch (type) {
        case 'A':
            res.send('A');
            // Fehlt: return oder break
        case 'B': // Fall-through!
            res.send('B'); // Wird auch ausgeführt!
            return;
    }
});

// Korrekt mit return
app.get('/status', (req, res) => {
    switch (type) {
        case 'A':
            res.send('A');
            return;
        case 'B':
            res.send('B');
            return;
    }
});
```

### 2. Async/Await ohne return

```javascript
// Fehlendes return bei async
app.get('/users', async (req, res) => {
    const users = await getUsers();
    res.json(users); // Fehlt: return
    console.log('Dies wird ausgeführt!');
});

// Mit return
app.get('/users', async (req, res) => {
    const users = await getUsers();
    return res.json(users);
});
```

### 3. Verschachtelte Bedingungen

```javascript
// Unvollständige Bedingungen
app.get('/data', (req, res) => {
    if (condition1) {
        if (condition2) {
            return res.send('A');
        }
        // Fehlt: Response wenn condition2 false ist
    }
    // Fehlt: Response wenn condition1 false ist
});

// Alle Fälle abgedeckt
app.get('/data', (req, res) => {
    if (condition1) {
        if (condition2) {
            return res.send('A');
        }
        return res.send('B');
    }
    return res.send('C');
});
```

<!-- TODO: Reimplement Autofix -->
<!-- ## Autofix

Diese Regel bietet einen automatischen Fix für **fehlende `return` Statements** nach Response-Aufrufen. Wenn ESLint im `--fix` Modus läuft, wird automatisch ein `return;` nach dem Response-Aufruf eingefügt.

```javascript
// Vorher
app.get('/users', (req, res) => {
    res.send('Hello');
    console.log('Dies wird ausgeführt');
});

// Nach Autofix
app.get('/users', (req, res) => {
    res.send('Hello');
    return;
    console.log('Dies wird nicht mehr ausgeführt');
});
```

**Hinweis:** Der Autofix fügt das `return` ein, entfernt aber keinen unerreichbaren Code. Du solltest den Code nach dem Fix manuell überprüfen und aufräumen. -->

## Optionen (Unwichtig für Studierende)

| Option | Typ | Standard |
|---|---|---|
| [`requireReturn`](#requirereturn) | `boolean` | `true` |
| [`allowDelegation`](#allowdelegation) | `boolean` | `true` |
| [`allowDeferredCallbacks`](#allowdeferredcallbacks) | `boolean` | `true` |
| [`responseMethods`](#responsemethods) | `string[]` | siehe unten |
| [`responseParamNames`](#responseparamnames) | `string[]` | `['res', 'response']` |
| [`requestParamNames`](#requestparamnames) | `string[]` | `['req', 'request']` |
| [`nextParamNames`](#nextparamnames) | `string[]` | `['next', '_next']` |

### `requireReturn`

Standard: `true`

Wenn aktiviert, muss auf jeden direkten Aufruf von `res.<methode>()` oder `next()` ein `return` folgen. Ausnahme ist ein Aufruf, der das Letzte ist, was im Handler passieren kann. Sonst wird `missingReturn` gemeldet.

Ein Aufruf ist gültig, wenn er

- selbst zurückgegeben wird (`return res.json()`, `return next()`, `return a && next()`),
- direkt von einem `return` gefolgt wird (`res.send(); return;`),
- oder die letzte Anweisung seines Pfades ist (nichts läuft danach noch).

Wie "letzte Anweisung" bestimmt wird:

- `if`/`else`, `try`/`catch`, beschriftete Anweisungen und einfache Blöcke werden nach außen durchlaufen. Ein Aufruf am Ende von `if (a) { res.send(); } else { next(); }` ist deshalb gültig, wenn das `if` die letzte Anweisung ist.
- `switch`: `res.send(); break;` verlässt den `switch` und ist gültig. Ein `case`, der in den nächsten durchfällt, wird gemeldet.
- Schleifen werden immer gemeldet, weil danach weiterer Code läuft.
- `try … finally` wird gemeldet, weil der `finally`-Block danach ausgeführt wird.

Code nach einem `return` ist unerreichbar und wird nicht geprüft.

### `allowDelegation`

Standard: `true`

Wenn aktiviert, zählt es als Abschluss, wenn `res` oder `next` als Argument weitergegeben wird, z. B. `stream.pipe(res)`, `promise.catch(next)` oder `delegate(req, res, next)`. Solche Aufrufe gelten als Übergabe der Anfrage und brauchen auch mit `requireReturn` kein `return`.

Mit `false` zählen nur direkte Aufrufe von `res.<methode>()` und `next()`.

### `allowDeferredCallbacks`

Standard: `true`

Wenn aktiviert, gilt eine Antwort oder ein `next()` innerhalb eines verschachtelten Callbacks als Abschluss des umgebenden Handlers an der Stelle, an der der Callback erzeugt wird. Das betrifft typische Callback-Muster wie `db.query(sql, (err, rows) => res.json(rows))`.

Der Callback selbst ist kein Handler und darf deshalb ein Einzeiler sein. Er wird bei `requireReturn` aber wie jede Funktion für sich geprüft: Innerhalb des Callbacks gilt `if (err) { next(err); } res.json(rows);` als `missingReturn`.

Mit `false` zählen Aufrufe in Callbacks nicht für den Handler.

> Hinweis: Auch mit `true` wird ein Callback, der nur in manchen Zweigen antwortet, für den Handler als Abschluss gezählt. Das ist eine bewusste Vereinfachung.

### `responseMethods`

Standard:

```json
["send", "json", "jsonp", "end", "redirect", "render", "sendFile", "sendStatus", "download"]
```

Methoden von `res`, die die Antwort beenden. Verkettete Aufrufe wie `res.status(404).json()` oder `res.set(...).end()` werden erkannt, weil die Regel die Kette bis zur Variable `res` zurückverfolgt.

Methoden, die die Antwort nicht beenden (`status`, `set`, `cookie`, `write`, …), zählen nicht. Mit der Option ersetzt du die Liste vollständig. Eigene Methoden müssen also zusammen mit den Standardwerten angegeben werden.

### `responseParamNames`

Standard: `['res', 'response']`

Parameternamen, die als Response-Objekt erkannt werden. Ein Parameter mit dem Typ `Response` wird unabhängig vom Namen erkannt.

### `requestParamNames`

Standard: `['req', 'request']`

Parameternamen, die als Request-Objekt erkannt werden. Ein Parameter mit dem Typ `Request` wird unabhängig vom Namen erkannt. Sie werden nur gebraucht, um Handler zu erkennen: Der Parameter vor dem Response-Parameter muss ein Request sein oder dahinter muss ein `next`-Parameter stehen.

### `nextParamNames`

Standard: `['next', '_next']`

Parameternamen, die als `next`-Funktion erkannt werden. Ein Parameter mit dem Typ `NextFunction` wird unabhängig vom Namen erkannt. Der erkannte Name wird für die Prüfung der `next()`-Aufrufe verwendet: Heißt der Parameter `_next`, zählt nur `_next()`.


## Weiterführende Ressourcen

- [Express Routing Guide](https://expressjs.com/en/guide/routing.html)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Express Using Middleware](https://expressjs.com/en/guide/using-middleware.html)

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.