# `no-standalone-expect`

Verhindert `expect` außerhalb eines Vitest-Testblocks.

## Regel Details

Assertions müssen innerhalb von `test` stehen. Die speziellen Aufrufe `expect.assertions()` und `expect.hasAssertions()` sind auch außerhalb eines Testblocks zulässig.

## Warum ist diese Regel wichtig?

Ein alleinstehendes `expect` wird nicht als Teil eines Tests ausgeführt oder gehört möglicherweise versehentlich in den globalen Modulcode. Dadurch entstehen unklare Testfehler und Seiteneffekte beim Laden der Testdatei.

## Beispiele

### Falsche Implementationen

```javascript
expect(config.enabled).toBe(true);

test('Konfiguration', () => {
    expect(config.name).toBe('test');
});
```

### Korrekte Implementationen

```javascript
test('prüft die Konfiguration', () => {
    expect(config.enabled).toBe(true);
});
```

## Optionen

Mit `additionalTestBlockFunctions` können eigene Test-Wrapper angegeben werden:

```javascript
{
    additionalTestBlockFunctions: ['integrationTest']
}
```

## Version

Diese Regel wurde in Version 1.0.0 eingeführt.
