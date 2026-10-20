# `valid-expect`

Stellt sicher, dass `expect()` mit einem gültigen Argument und einem aufgerufenen Matcher verwendet wird.

## Regel Details

Die Regel prüft:

1. Die minimale und maximale Anzahl der Argumente von `expect()`.
2. Ob ein bekannter Modifier wie `not`, `resolves` oder `rejects` verwendet wird.
3. Ob auf `expect()` ein Matcher folgt und dieser tatsächlich aufgerufen wird.
4. Ob asynchrone Assertions mit `await` abgewartet oder zulässig zurückgegeben werden.

## Beispiele

### Falsche Implementationen

```javascript
expect();
expect(value).toBe;
expect(promise).resolves.toBe('ok');
```

### Korrekte Implementationen

```javascript
expect(value).toBeDefined();
await expect(promise).resolves.toBe('ok');
```

## Optionen

```javascript
{
    alwaysAwait: true,
    asyncMatchers: ['toResolve', 'toReject'],
    minArgs: 1,
    maxArgs: 1
}
```

`alwaysAwait` verlangt bei asynchronen Assertions `await`. Mit `asyncMatchers` können weitere asynchrone Matcher registriert werden. `minArgs` und `maxArgs` begrenzen die Argumentanzahl von `expect()`.

## Autofix

Diese Regel bietet für bestimmte ungültige Matcher-Verwendungen einen Autofix an. Asynchrone Assertions können je nach Kontext nicht vollständig automatisch korrigiert werden und sollten nach dem Fix geprüft werden.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
