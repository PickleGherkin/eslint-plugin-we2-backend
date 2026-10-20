# `no-identical-title`

Verhindert identische Titel in derselben Jest-Test- oder Describe-Ebene.

## Warum ist diese Regel wichtig?

Jest zeigt Testtitel in Fehlermeldungen und Ergebnissen an. Gleiche Titel erschweren die Zuordnung eines Fehlers und können bei komplexen Teststrukturen zu unklaren Ergebnissen führen.

## Beispiele

### Falsche Implementationen

```javascript
test('wird erstellt', () => {});
test('wird erstellt', () => {});
```

### Korrekte Implementationen

```javascript
test('wird mit gültigen Daten erstellt', () => {});
test('wird mit ungültigen Daten abgelehnt', () => {});
```

Titel werden innerhalb ihres jeweiligen `test`-Kontexts verglichen. Parametrisierte Aufrufe mit `.each` werden von dieser Prüfung ausgenommen.

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
