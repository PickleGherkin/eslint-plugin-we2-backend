# `no-hardcoded-url`

Verhindert fest im Quellcode eingetragene `localhost`-URLs.

## Regel Details

Diese Regel meldet:

1. Zeichenketten, die `localhost` enthalten.
2. Template-Literale, die `localhost` enthalten, auch wenn sie interpolierte Werte verwenden.

## Warum ist diese Regel wichtig?

Eine fest eingetragene lokale Adresse funktioniert häufig nur auf dem eigenen Rechner. In Tests, CI-Pipelines und unterschiedlichen Umgebungen sollen Host und Port über Umgebungsvariablen oder eine zentrale Konfiguration gesetzt werden.

## Beispiele

### Falsche Implementationen

```javascript
const apiUrl = 'http://localhost:3000/api';
const url = `http://localhost:${port}/users`;
```

### Korrekte Implementationen

```javascript
const apiUrl = process.env.API_URL;
const url = `${process.env.API_URL}/users`;
```

## Best Practices

Verwende eine `.env`-Datei oder eine Konfigurationsschnittstelle und validiere erforderliche Variablen beim Start der Anwendung.

## Weiterführende Ressourcen

- [dotenv](https://github.com/motdotla/dotenv)

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
