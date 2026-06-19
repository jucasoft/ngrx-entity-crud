/**
 * Utility di privacy per la dashboard: poiché può girare anche in PRODUZIONE, i valori non
 * vengono mai mostrati di default e — quando il consumer abilita esplicitamente il reveal —
 * vengono comunque mascherati i pattern sensibili (token/JWT/email/segreti).
 */

const SENSITIVE_KEY =
  /(token|secret|password|passwd|pwd|auth(orization)?|credential|api[-_]?key|jwt|session|cookie|bearer)/i;

/** `true` se il nome chiave suggerisce un contenuto sensibile (token, password, ecc.). */
export function looksSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key || '');
}

/** Redige nel testo i pattern sensibili comuni (JWT, email, token/hex lunghi). */
export function redactSensitive(value: string): string {
  return (value || '')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '«jwt-redatto»')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '«email-redatta»')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '«hex-redatto»')
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, '«token-redatto»');
}

/**
 * Valore "sicuro da mostrare": se la chiave è sensibile, nasconde tutto (mostra solo la
 * lunghezza); altrimenti redige i pattern sensibili e tronca a `maxLength`.
 */
export function maskValue(key: string, value: string, maxLength = 200): string {
  if (looksSensitiveKey(key)) {
    return `«nascosto» (${(value || '').length} caratteri)`;
  }
  let out = redactSensitive(value);
  if (out.length > maxLength) {
    out = out.slice(0, maxLength) + '… (troncato)';
  }
  return out;
}
