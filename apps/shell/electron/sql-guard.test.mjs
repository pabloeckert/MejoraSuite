import test from 'node:test'
import assert from 'node:assert/strict'
import { assertReadOnlySelect } from './sql-guard.mjs'

test('acepta un SELECT simple y quita el ; final', () => {
  assert.equal(assertReadOnlySelect('  SELECT * FROM clientes WHERE id = ?; '), 'SELECT * FROM clientes WHERE id = ?')
})

test('rechaza escrituras', () => {
  for (const q of ['DELETE FROM clientes', 'UPDATE clientes SET nombre = 1', 'INSERT INTO clientes VALUES (1)', 'DROP TABLE clientes']) {
    assert.throws(() => assertReadOnlySelect(q), /solo admite/)
  }
})

test('rechaza múltiples sentencias', () => {
  assert.throws(() => assertReadOnlySelect('SELECT 1; DROP TABLE clientes'), /solo admite/)
})

test('rechaza ATTACH, PRAGMA y load_extension aunque empiecen con SELECT', () => {
  assert.throws(() => assertReadOnlySelect("SELECT load_extension('x')"), /solo admite/)
  assert.throws(() => assertReadOnlySelect('SELECT * FROM pragma_table_info(1) -- pragma'), /solo admite/)
})

test('rechaza entradas que no son texto', () => {
  for (const q of [undefined, null, 42, {}, ['SELECT 1']]) {
    assert.throws(() => assertReadOnlySelect(q), /solo admite/)
  }
})
