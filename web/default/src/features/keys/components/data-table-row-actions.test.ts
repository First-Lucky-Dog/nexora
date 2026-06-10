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
import { resolveRealKeyForMenuAction } from './data-table-row-actions'

describe('API key row actions', () => {
  test('uses cached real key without issuing another request', async () => {
    let requestCount = 0

    const key = await resolveRealKeyForMenuAction(53, 'sk-cached', async () => {
      requestCount += 1
      return 'sk-fetched'
    })

    assert.equal(key, 'sk-cached')
    assert.equal(requestCount, 0)
  })

  test('fetches the real key lazily when a menu action needs it', async () => {
    let requestedId = 0

    const key = await resolveRealKeyForMenuAction(53, undefined, async (id) => {
      requestedId = id
      return 'sk-fetched'
    })

    assert.equal(key, 'sk-fetched')
    assert.equal(requestedId, 53)
  })
})
