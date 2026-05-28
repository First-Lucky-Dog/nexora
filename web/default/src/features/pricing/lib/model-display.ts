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
import type { PricingModel } from '../types'

export type CustomModelMetadata = {
  provider: string
  icon: string
  vendorName: string
  displayName?: string
  description?: string
}

type BackendDisplayFields = {
  display_name?: string
  displayName?: string
  title?: string
  alias?: string
  icon?: string
}

export type PricingModelWithDisplay = PricingModel & BackendDisplayFields

const NANO_BANANA_PROVIDER_METADATA: CustomModelMetadata = {
  provider: 'gemini',
  icon: 'Gemini.Color',
  vendorName: 'Google',
}

export const CUSTOM_MODEL_METADATA: Record<string, CustomModelMetadata> = {
  nanobanana: {
    ...NANO_BANANA_PROVIDER_METADATA,
    displayName: 'Nano Banana',
    description:
      'Nano Banana 图像生成与编辑模型，适合日常文生图、图生图、图片修改、商品图和轻量创意设计场景，速度较快，成本较低。',
  },
  'nanobanana-pro': {
    ...NANO_BANANA_PROVIDER_METADATA,
    displayName: 'Nano Banana Pro',
    description:
      'Nano Banana Pro 高质量图像生成与编辑模型，适合复杂场景、海报图、产品图、精修图和高质量创意设计任务。',
  },
  'nanobanana-pro-metered': {
    ...NANO_BANANA_PROVIDER_METADATA,
    displayName: 'Nano Banana Pro Metered',
    description:
      'Nano Banana Pro 按量计费版本，适合内部测试、高阶用户或精细计费场景，费用按输入与输出 token 计算。',
  },
  'nanobanana-2': {
    ...NANO_BANANA_PROVIDER_METADATA,
    displayName: 'Nano Banana 2',
    description:
      'Nano Banana 2 新版图像生成与编辑模型，适合兼顾速度、质量和成本的图片生成、图片修改和多轮编辑场景。',
  },
  'nanobanana-2-metered': {
    ...NANO_BANANA_PROVIDER_METADATA,
    displayName: 'Nano Banana 2 Metered',
    description:
      'Nano Banana 2 按量计费版本，适合内部测试、高阶用户或精细计费场景，费用按输入与输出 token 计算。',
  },
}

function normalizeModelName(modelName?: string | null): string {
  return (modelName || '').trim().toLowerCase()
}

function firstNonBlank(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

export function isNanoBananaModelName(modelName?: string | null): boolean {
  const normalized = normalizeModelName(modelName)
  return normalized === 'nanobanana' || normalized.startsWith('nanobanana-')
}

export function getCustomModelMetadata(
  modelName?: string | null
): CustomModelMetadata | undefined {
  const normalized = normalizeModelName(modelName)
  return (
    CUSTOM_MODEL_METADATA[normalized] ||
    (isNanoBananaModelName(normalized)
      ? NANO_BANANA_PROVIDER_METADATA
      : undefined)
  )
}

export function getModelDisplayName(model: PricingModelWithDisplay): string {
  const metadata = getCustomModelMetadata(model.model_name)
  return (
    firstNonBlank(
      model.displayName,
      model.display_name,
      model.title,
      model.alias,
      metadata?.displayName,
      model.model_name
    ) || ''
  )
}

export function resolveModelDisplayMetadata<T extends PricingModelWithDisplay>(
  model: T
): T & { display_name: string } {
  const metadata = getCustomModelMetadata(model.model_name)
  const displayName = getModelDisplayName(model)
  const description = firstNonBlank(model.description, metadata?.description)
  const vendorIcon = firstNonBlank(
    model.vendor_icon,
    model.icon,
    metadata?.icon
  )
  const vendorName = firstNonBlank(model.vendor_name, metadata?.vendorName)

  return {
    ...model,
    ...(description ? { description } : {}),
    ...(vendorIcon ? { vendor_icon: vendorIcon } : {}),
    ...(vendorName ? { vendor_name: vendorName } : {}),
    display_name: displayName,
  }
}
