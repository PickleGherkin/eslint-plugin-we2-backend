# `expect-expect`

Stellt sicher, dass jeder Jest-Test mindestens eine Assertion enthält.

## Regel Details

Standardmäßig wird ein Aufruf von `expect` als Assertion erkannt. Die Regel untersucht auch Testfunktionen, die über Variablen oder benutzerdefinierte Wrapper aufgerufen werden. `test.todo` wird nicht als auszuführender Test behandelt.

## Warum ist diese Regel wichtig?

Ein Test ohne Assertion kann erfolgreich sein, obwohl die gewünschte Funktionalität nicht geprüft wurde. Solche Tests erzeugen leicht falsche Sicherheit, insbesondere wenn Setup- oder Anfragecode weiterhin ausgeführt wird.

## Beispiele

### Falsche Implementationen

```javascript
test('erstellt einen Nutzer', () => {
    createUser();
});
```

### Korrekte Implementationen

```javascript
test('erstellt einen Nutzer', () => {
    const user = createUser();
    expect(user.name).toBe('Ada');
});
```

## Optionen

```javascript
{
    assertFunctionNames: ['expect', 'assert'],
    additionalTestBlockFunctions: ['theoreticallyTest']
}
```

`assertFunctionNames` enthält Namen oder Muster von Funktionen, die als Assertion gelten. `*` steht für ein Segment, `**` für mehrere Segmente. Mit `additionalTestBlockFunctions` können eigene Test-Wrapper ergänzt werden.


## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
