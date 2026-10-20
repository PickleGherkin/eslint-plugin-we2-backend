# `valid-title`

Stellt sicher, dass Titel von `describe`, `test` und `it` aussagekräftig und gültig sind.

## Regel Details

Standardmäßig prüft die Regel:

1. Der Titel ist eine Zeichenkette und nicht leer.
2. Der Titel hat keine versehentlichen führenden oder abschließenden Leerzeichen.
3. Präfixe werden nicht doppelt verwendet.
4. Konfigurierte unerwünschte Wörter kommen nicht als ganze Wörter vor.
5. Titel erfüllen bei Bedarf ein konfiguriertes `mustMatch`- oder `mustNotMatch`-Muster.

## Beispiele

### Falsche Implementationen

```javascript
test('', () => {}); // <= Test Titel ist leer.
test('test create user', () => {}); // <= Eine Wiederholung von 'test' im Titel ist nicht nötig.
```

### Korrekte Implementationen

```javascript
test('erstellt einen Nutzer', () => {});
test('create user', () => {});
```

## Optionen

```javascript
{
    ignoreSpaces: true,
    ignoreTypeOfDescribeName: false,
    ignoreTypeOfTestName: false,
    disallowedWords: ['korrekt'],
    mustMatch: '^[A-Z]'
}
```

Mit `ignoreSpaces` werden führende und abschließende Leerzeichen erlaubt. `ignoreTypeOfDescribeName` und `ignoreTypeOfTestName` deaktivieren jeweils die Prüfung des Titeltyps. `disallowedWords` enthält unerwünschte ganze Wörter. `mustMatch` und `mustNotMatch` akzeptieren reguläre Ausdrücke als Zeichenkette und können auf `describe`, `test` oder `it` begrenzt werden.

## Autofix

Diese Regel bietet einen Autofix an, unter anderem zum Entfernen versehentlicher Leerzeichen. Prüfe Änderungen an Titeln manuell, da Titel Teil der Testausgabe sind.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
