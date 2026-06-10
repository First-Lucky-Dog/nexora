/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  buildModelOptions,
  extractModelIds,
  normalizeApiKey,
} from './cc-switch-dialog'

describe('CC Switch dialog model options', () => {
  test('uses token-scoped models for the import dropdown', () => {
    const options = buildModelOptions(['image-model', 'banana-model'])

    assert.deepEqual(options, [
      { value: 'image-model', label: 'image-model' },
      { value: 'banana-model', label: 'banana-model' },
    ])
  })

  test('extracts model ids from OpenAI-compatible list response', () => {
    const ids = extractModelIds({
      object: 'list',
      data: [
        { id: 'image-model', object: 'model' },
        { id: 'chat-model', object: 'model' },
      ],
    })

    assert.deepEqual(ids, ['image-model', 'chat-model'])
  })

  test('ignores invalid model list entries', () => {
    const ids = extractModelIds({
      data: [
        { id: 'image-model' },
        { id: '' },
        { id: 123 },
        null,
        { object: 'model' },
      ],
    })

    assert.deepEqual(ids, ['image-model'])
  })

  test('normalizes keys for token-authenticated model list requests', () => {
    assert.equal(normalizeApiKey('abc123'), 'sk-abc123')
    assert.equal(normalizeApiKey('sk-abc123'), 'sk-abc123')
    assert.equal(normalizeApiKey('  '), '')
  })
})
