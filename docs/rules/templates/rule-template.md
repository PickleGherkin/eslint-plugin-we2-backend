# rule-template

Kurze Beschreibung der Regel.

## Regel Details

Diese Regel überprüft diese häufigen Fehler:

1. **Detail 1**: Beschreibung des Details.
2. **Detail 2**: Beschreibung des Details.
3. **Detail 3 mit `keyword`**: Beschreibung des Details mit `keyword`.

## Warum ist diese Regel wichtig?

### Problem 1: Beispiel
Hier näher beschreiben und unten gibt es Beispielcode.

```javascript
// Kommentar
function foo() {
    return "foo";
}
```

### Problem 2: Beispiel
Hier näher beschreiben und unten gibt es Beispielcode.

```javascript
// Kommentar
function foo() {
    return "foo";
}
```

**Hinweis:** Diese Regel bietet einen **Autofix** an, der automatisch ein irgendwas macht.

## Beispiele

### Falsche Implementationen

```javascript
// Kommentar
function foo() {
    return "foo";
}
```

### Korrekte Implementationen

```javascript
// Kommentar
function foo() {
    return "foo";
}
```

## Best Practices

### 1. Best Practice 1

```javascript
// Gut
function foo() {
    return "foo";
}

// Auch gut
function foo() {
    return "foo";
}
```

## Häufige Fehlerquellen

### 1. Erste Fehlerquelle

```javascript
function foo() {
    "foo"; // Vergessenes 'return'
}
```

## Autofix

Diese Regel bietet einen automatischen Fix für **irgendwas**. Wenn ESLint im `--fix` Modus läuft, wird automatisch ein `irgendwas` gemacht.

```javascript
// Vorher
function foo() {
    "foo"; // Vergessenes 'return'
}

// Nach Autofix
function foo() {
    return "foo"; // 'return' eingesetzt
}
```

**Hinweis:** Der Autofix fügt das `return` ein, entfernt aber keinen unerreichbaren Code. Du solltest den Code nach dem Fix manuell überprüfen und aufräumen.

<!-- ## Optionen

Diese Regel hat keine Optionen. -->

## Weiterführende Ressourcen

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.