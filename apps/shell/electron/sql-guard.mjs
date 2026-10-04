// Validación de solo lectura para consultas SQL recibidas desde el renderer.
// Admite una única sentencia SELECT; rechaza múltiples sentencias, ATTACH, PRAGMA y load_extension.
export function assertReadOnlySelect(sql) {
  const text = typeof sql === 'string' ? sql.trim().replace(/;\s*$/, '') : ''
  const isSelect = /^select\s/i.test(text)
  const hasSecondStatement = text.includes(';')
  const hasForbidden = /\b(attach|pragma|load_extension)\b/i.test(text)
  if (!isSelect || hasSecondStatement || hasForbidden) {
    throw new Error('suite:db:query solo admite una sentencia SELECT de lectura')
  }
  return text
}
