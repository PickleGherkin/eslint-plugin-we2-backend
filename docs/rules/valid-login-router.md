# valid-login-router

Stellt sicher, dass der Login-Router korrekt implementiert wird und bereits implementierte Service-Funktionen nutzt, um das DRY-Prinzip (Don't Repeat Yourself) einzuhalten.

## Regel Details

Diese Regel überprüft Express-Route-Handler für den Login auf die direkte Verwendung von rohen Authentifizierungs- oder Bcrypt-Funktionen. Stattdessen sollen die abstrahierten Methoden eines zentralen `JWTService` verwendet werden.

Die Regel warnt bei folgenden Aufrufen innerhalb des Login-Route-Handlers:

1. **Direktes `bcrypt.compare` oder `compare`**: Sollte vermieden werden.
2. **Direktes `jwt.verify`, `jsonwebtoken.verify` oder `verify`**: Sollte vermieden werden.
3. **Direkter Aufruf einer `login()` Funktion**: Sollte zugunsten der Service-Funktionen vermieden werden.

## Warum ist diese Regel wichtig?

Das direkte Aufrufen von `bcrypt` oder `jsonwebtoken` Methoden in den Express-Routen führt oft zu dupliziertem Code und mischt die Router-Layer mit der Service-Layer. 

Indem diese Logik in `JWTService` ausgelagert wird, bleiben die Route-Handler kompakt und übersichtlich und Änderungen an den Token- oder Hashing-Strategien müssen nur an einer einzigen Stelle im Code vorgenommen werden.

### Problem: Direkte Nutzung von bcrypt und JWT im Handler
Wenn Passwörter direkt in der Route verglichen und Tokens dort signiert/verifiziert werden hält man sich nicht an der Schichtenarchitekur und verschlechtert die Code-Qualität, besonders dann wenn diese Logik bereits woanders implementiert ist.

## Beispiele

### Falsche Implementationen

```javascript
// Direkte Verwendung von bcrypt.compare oder compare
import { compare } from "bcrypt"; // Nicht erlaubt!
import { User } from "../model/UserModel"; // Keine Model-Layer Imports erlaubt in der Router-Layer!

loginRouter.post("/", async (req, res) => {
    const user = await User.findOne({
        userId: req.body.userId
    }).exec(); // Kritischer Fehler: Verwendung von Entity-Layer Funktionen innerhalb der Router!
    const result = await compare(req.body.password, user.password); // Nicht erlaubt!
    ...
});

// Direkte Verwendung von verify
import { verify } from "jsonwebtoken"; // Nicht erlaubt!

loginRouter.get("/", async (req, res) => {
    const token = req.cookies.access_token;
    const secret = process.env.JWT_SECRET; // Auf keinen Fall sensible Umgebungsvariablen in den Routern laden!
    const result = verify(token, secret); // Nicht erlaubt!
    ...
});

// Aufruf einer generischen login() Methode anstelle des JWTService
import { login } from "../services/AuthenticationService"; // Nicht erlaubt!

loginRouter.post("/", async (req, res) => {
    const result = await login(req.body.userId, req.body.password); // Nicht erlaubt!
    ...
});
```

### Korrekte Implementationen

```javascript
// Nutzung der Service-Funktionen aus dem JWTService
import { verifyPasswordAndCreateJWT } from "../services/JWTService";

loginRouter.post("/", async (req, res) => {
    // Korrekt: verifyPasswordAndCreateJWT verwenden um zu authentifizieren und token Generierung 
    const userId = req.body.userId;
    const password = req.body.password;
    const jwtTokenString = await verifyPasswordAndCreateJWT(
        userId, 
        password
    );
    if (!jwtTokenString) {
        res.sendStatus(401);
        return;
    }
    // Korrekt: verifyJWT statt jwt.verify für die Token-Validierung
    const loginRes = verifyJWT(jwtTokenString);
    res.cookie("access_token", jwtTokenString, {
        ... // Hier deine Cookie-Konfiguration
    })
    res.status(201).send(loginRes);
    return;
});
```

## Best Practices

### Nutzung der Funktionen von JWTService
Nutze die bereits von dir implementierten Funktionen von `JWTService` für das Hashen, Überprüfen von Passwörtern, sowie dem Signieren oder Verifizieren von JWTs.

### Einhalten der Schichtenarchitektur
Vergewissere dich, dass keine Funktionen der Model-Layer in den Routen verwendet werden und dass keine sensiblen Umgebungsvariablen in den Routen vorzufinden sind.

<!-- ## Optionen

Diese Regel hat keine Optionen. -->

## Weiterführende Ressourcen

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
