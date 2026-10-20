# `no-alias-methods`

Verlangt die kanonischen Namen für Jest-Matcher anstelle ihrer Alias-Methoden.

## Regel Details

Unter anderem werden `toBeCalled`, `toReturn` und `toThrowError` auf die bevorzugten Namen `toHaveBeenCalled`, `toHaveReturned` und `toThrow` abgebildet. Auch Varianten wie `lastCalledWith` und `nthCalledWith` werden erkannt.

## Warum ist diese Regel wichtig?

Kanonische Matcher-Namen sind einheitlicher und entsprechen der aktuellen Jest-Dokumentation. Dadurch werden Tests leichter lesbar und Alias-Varianten nicht versehentlich in neuen Tests weiterverwendet.

## Beispiele

### Falsche Implementationen

```javascript
expect(mock).toBeCalled();
expect(fn).toThrowError();
```

### Korrekte Implementationen

```javascript
expect(mock).toHaveBeenCalled();
expect(fn).toThrow();
```

## Autofix

Diese Regel bietet einen Autofix an. Die erkannte Alias-Methode wird durch ihren kanonischen Namen ersetzt.

```javascript
// Vorher
expect(mock).toReturnTimes(2);

// Nach Autofix
expect(mock).toHaveReturnedTimes(2);
```

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
