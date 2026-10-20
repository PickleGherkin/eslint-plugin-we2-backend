# `valid-expect-in-promise`

Stellt sicher, dass Promise-Ketten mit `expect` zurückgegeben oder abgewartet werden.

## Warum ist diese Regel wichtig?

Eine Assertion innerhalb von `.then()` oder `.catch()` wird erst ausgeführt, wenn die Promise-Kette ausgeführt wird. Wird die Kette weder mit `await` abgewartet noch zurückgegeben, kann Jest den Test beenden, bevor die Assertion läuft.

## Beispiele

### Falsche Implementationen

```javascript
test('lädt den Nutzer', () => {
    request('/users').then(response => {
        expect(response.status).toBe(200);
    });
});
```

### Korrekte Implementationen

```javascript
test('lädt den Nutzer', async () => {
    await request('/users').then(response => {
        expect(response.status).toBe(200);
    });
});

test('lädt den Nutzer', () => {
    return request('/users').then(response => {
        expect(response.status).toBe(200);
    });
});
```

Bei Tests mit einem `done`-Callback wird die Verantwortung für die Beendigung des Tests über diesen Callback gesteuert.

## Autofix

Diese Regel bietet keinen Autofix an. Ob `await` oder `return` passend ist, hängt vom Aufbau des Tests ab.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
