# `prefer-to-contain`

Empfiehlt `toContain()` für Prüfungen, ob ein Array oder eine Zeichenkette einen Wert enthält.

## Warum ist diese Regel wichtig?

`expect(array.includes(value)).toBe(true)` beschreibt die Absicht indirekt. `toContain` ist in Vitest dafür vorgesehen und macht die Assertion kompakter und lesbarer.

## Beispiele

### Falsche Implementationen

```javascript
expect(users.includes(user)).toBe(true);
expect(names.includes('Ada')).toEqual(false);
```

### Korrekte Implementationen

```javascript
expect(users).toContain(user);
expect(names).not.toContain('Ada');
```

Die Regel berücksichtigt auch `toEqual` und den Modifier `not`, sofern die ursprüngliche Prüfung einen einzelnen Boolean vergleicht.

## Autofix

Diese Regel bietet einen Autofix an. Der `includes`-Aufruf wird in eine `toContain`-Assertion umgewandelt und bei Bedarf wird `not` ergänzt.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
