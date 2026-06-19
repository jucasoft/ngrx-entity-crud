import {looksSensitiveKey, maskValue, redactSensitive} from './mask';

describe('mask', () => {
  it('riconosce le chiavi sensibili', () => {
    expect(looksSensitiveKey('access_token')).toBe(true);
    expect(looksSensitiveKey('AUTH')).toBe(true);
    expect(looksSensitiveKey('apiKey')).toBe(true);
    expect(looksSensitiveKey('user.profile')).toBe(false);
    expect(looksSensitiveKey('coin')).toBe(false);
  });

  it('nasconde completamente i valori delle chiavi sensibili (mostra solo la lunghezza)', () => {
    const masked = maskValue('access_token', 'abcdef');
    expect(masked).toContain('nascosto');
    expect(masked).toContain('6');
    expect(masked).not.toContain('abcdef');
  });

  it('redige JWT, email e token lunghi nei valori non sensibili', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abcDEF123ghiJKL456mnoPQR';
    expect(redactSensitive('t=' + jwt)).toContain('«jwt-redatto»');
    expect(redactSensitive('scrivi a mario.rossi@example.com ora')).toContain('«email-redatta»');
    expect(redactSensitive('id ' + 'g'.repeat(40))).toContain('«token-redatto»'); // 'g' non è hex
    expect(redactSensitive('hex ' + 'f'.repeat(32))).toContain('«hex-redatto»');
  });

  it('tronca i valori lunghi non sensibili', () => {
    const long = Array(100).fill('parola').join(' '); // ~699 char, nessun token unico
    const masked = maskValue('note', long);
    expect(masked.endsWith('… (troncato)')).toBe(true);
    expect(masked.length).toBeLessThan(long.length);
  });

  it('lascia intatti i valori brevi e innocui', () => {
    expect(maskValue('theme', 'dark')).toBe('dark');
  });
});
