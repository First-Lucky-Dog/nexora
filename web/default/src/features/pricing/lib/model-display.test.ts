import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  getCustomModelMetadata,
  resolveModelDisplayMetadata,
} from './model-display'
import type { PricingModel } from '../types'

describe('pricing model display metadata', () => {
  test('maps Nano Banana aliases to Gemini display metadata', () => {
    const cases = [
      [
        'nanobanana',
        'Nano Banana',
        'Nano Banana 图像生成与编辑模型，适合日常文生图、图生图、图片修改、商品图和轻量创意设计场景，速度较快，成本较低。',
      ],
      [
        'nanobanana-pro',
        'Nano Banana Pro',
        'Nano Banana Pro 高质量图像生成与编辑模型，适合复杂场景、海报图、产品图、精修图和高质量创意设计任务。',
      ],
      [
        'nanobanana-pro-metered',
        'Nano Banana Pro Metered',
        'Nano Banana Pro 按量计费版本，适合内部测试、高阶用户或精细计费场景，费用按输入与输出 token 计算。',
      ],
      [
        'nanobanana-2',
        'Nano Banana 2',
        'Nano Banana 2 新版图像生成与编辑模型，适合兼顾速度、质量和成本的图片生成、图片修改和多轮编辑场景。',
      ],
      [
        'nanobanana-2-metered',
        'Nano Banana 2 Metered',
        'Nano Banana 2 按量计费版本，适合内部测试、高阶用户或精细计费场景，费用按输入与输出 token 计算。',
      ],
    ] as const

    for (const [modelName, displayName, description] of cases) {
      const model: PricingModel = {
        id: 1,
        model_name: modelName,
        description: '',
        quota_type: 0,
        model_ratio: 1,
        completion_ratio: 1,
        enable_groups: [],
      }

      const resolved = resolveModelDisplayMetadata(model)

      assert.equal(resolved.model_name, modelName)
      assert.equal(resolved.display_name, displayName)
      assert.equal(resolved.vendor_icon, 'Gemini.Color')
      assert.equal(resolved.vendor_name, 'Google')
      assert.equal(resolved.description, description)
    }
  })

  test('preserves backend display fields over custom metadata', () => {
    const model: PricingModel = {
      id: 2,
      model_name: 'nanobanana',
      display_name: 'Backend Banana',
      description: 'Backend description',
      vendor_icon: 'Custom.Icon',
      vendor_name: 'Custom Vendor',
      quota_type: 0,
      model_ratio: 1,
      completion_ratio: 1,
      enable_groups: [],
    }

    const resolved = resolveModelDisplayMetadata(model)

    assert.equal(resolved.display_name, 'Backend Banana')
    assert.equal(resolved.description, 'Backend description')
    assert.equal(resolved.vendor_icon, 'Custom.Icon')
    assert.equal(resolved.vendor_name, 'Custom Vendor')
  })

  test('returns prefix icon metadata for unmapped Nano Banana variants', () => {
    const metadata = getCustomModelMetadata('nanobanana-experimental')

    assert.equal(metadata?.icon, 'Gemini.Color')
    assert.equal(metadata?.provider, 'gemini')
    assert.equal(metadata?.vendorName, 'Google')
    assert.equal(metadata?.description, undefined)
  })
})
