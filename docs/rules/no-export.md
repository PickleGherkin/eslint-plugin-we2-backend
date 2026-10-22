# `no-export`

Verhindert Exporte aus Dateien, die Vitest-Tests enthalten.

## Warum ist diese Regel wichtig?

Wenn eine Testdatei importiert wird, kann Vitest deren Tests erneut registrieren. Exporte aus solchen Dateien fördern deshalb unübersichtliche Abhängigkeiten und können zu doppelten Testregistrierungen oder unvorhersehbaren Ergebnissen führen.

## Beispiele

### Falsche Implementationen

```javascript
export const createUser = () => ({ name: 'Ada' });

test('erstellt einen Nutzer', () => {
    expect(createUser()).toBeDefined();
});
```

### Korrekte Implementationen

```javascript
import { createUser } from './user-helper';

test('erstellt einen Nutzer', () => {
    expect(createUser()).toBeDefined();
});
```

Helferfunktionen gehören in eine eigene Datei, zum Beispiel `user-helper.ts`. Die Regel berücksichtigt sowohl ES-Module als auch `module.exports` und `exports`.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
