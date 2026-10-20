# `prefer-to-have-length`

Empfiehlt `toHaveLength()` für Längenprüfungen.

## Beispiele

### Falsche Implementationen

```javascript
expect(items.length).toBe(3);
expect(text.length).toEqual(10);
```

### Korrekte Implementationen

```javascript
expect(items).toHaveLength(3);
expect(text).toHaveLength(10);
```

`toHaveLength` drückt direkt aus, dass die Länge eines Arrays oder einer Zeichenkette geprüft wird.

## Autofix

Diese Regel bietet einen Autofix an. Der Zugriff auf `.length` wird entfernt und der Matcher durch `toHaveLength` ersetzt.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
