# `no-conditional-expect`

Verhindert `expect`-Aufrufe innerhalb bedingter Ausdrücke oder eines `catch`-Blocks.

## Regel Details

Gemeldet werden Assertions in `if`, `switch`, ternären Ausdrücken, logischen Ausdrücken und `try/catch`-Fehlerbehandlungen. Eine Assertion soll unabhängig davon ausgeführt werden, welchen Kontrollpfad der Test nimmt.

## Warum ist diese Regel wichtig?

Wenn eine Bedingung nicht erfüllt ist, wird die Assertion übersprungen und der Test kann trotzdem erfolgreich sein. Ein `expect` im `catch`-Block kann außerdem einen Fehler maskieren, statt den eigentlichen Fehler sichtbar zu machen. Für eine Best-Practice müssen Kontrollpfadabzweigungen in Tests vermieden werden – das heißt konkret: **Ein Test muss so geschrieben werden, dass er zur Laufzeit von oben nach unten ohne Abzweigungen ausgeführt wird.**

## Beispiele

### Falsche Implementationen

```javascript
test('Get User', () => {
    if (user) {
        expect(user.name).toBe('Ada');
    }
    // Nach der If-Bedingung folgen keine weiteren `expects`. Sehr anfällig für schwer auffindbare Fehler! 
    // Best-Practice =>  Wir wollen Kontrollpfadabzweigungen beim testen vermeiden! 
});

// Promise-Ergebnisse testen
test('Create User - Invalid User', async () => {
    try {
        await createUser("Some invalid user");  // <= Wenn hier kein Fehler geworfen wird,
                                                // wird der Test trotzdem als postiv ausgewertet!
                                                // Der Catch-Block wird nie erreicht und Vitest bewertet
                                                // jeden Test (ohne vorhandenes 'expect') standardmäßig
                                                // als positiv.
    } catch (error) {
        expect(error.message).toBe("Failed to create User");    // <= Mit dem Wissen von oben maskiert dieses
                                                                //  'expect' den eigentlichen Fehler im Try-Block!
    }
    // Auch hier wird klar: Try-Catch Abzweigungen in Tests sind unschön und extrem fehleranfällig.
});
```

### Korrekte Implementationen

```javascript
test('Get User', () => {
    expect(user).toBeDefined(); // <= Wir nutzen vorher Vitest-Matcher um festzustellen ob der User überhaupt existiert.
    expect(user.name).toBe('Ada');  // <= Jetzt wissen wir, dass der User existiert und können die Felder testen.
                                    // Hinweis: Wenn TypeScript hier meckert kann man den
                                    // sogenannten 'non-null assertion operator' (user!.name) verwenden.
});

// Promise-Ergebnisse testen
test('Create User - Invalid User', async () => {
    await expect(createUser("Some invalid user")).rejects.toThrow(); // <= Ist das nicht schön? Wir nutzen Vitest-Matcher
                                                                // um Promises aufzulösen ('.rejects' oder '.resolves')
});
```

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
