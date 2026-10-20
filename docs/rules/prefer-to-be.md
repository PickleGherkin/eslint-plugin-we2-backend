# `prefer-to-be`

Empfiehlt `toBe()` für primitive Werte und die passenden spezialisierten Matcher.

## Regel Details

Die Regel empfiehlt:

1. `toBe` für primitive Literale wie Zahlen, Zeichenketten und Booleans.
2. `toBeNull()` für `null`.
3. `toBeUndefined()` oder `toBeDefined()` für `undefined`.
4. `toBeNaN()` für `NaN`.

## Beispiele

### Falsche Implementationen

```javascript
expect(status).toEqual(200);
expect(value).toEqual(null);
expect(value).not.toBeUndefined();
```

### Korrekte Implementationen

```javascript
expect(status).toBe(200);
expect(value).toBeNull();
expect(value).toBeDefined();
```

Objekte, Arrays und reguläre Ausdrücke werden nicht pauschal in `toBe` umgewandelt, weil sich dadurch die Vergleichssemantik ändern kann.

## Autofix

Diese Regel bietet einen Autofix an. Matcher und gegebenenfalls überflüssige Argumente oder den Modifier `not` werden angepasst. Der erzeugte Code sollte anschließend geprüft werden.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
