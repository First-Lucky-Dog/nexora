# 生图模型与提示词模型接入文档

本文档面向需要快速接入本服务的应用或 Codex 等 agent。接口整体兼容 OpenAI 风格：文本/提示词模型使用 Chat Completions；文生图使用 Images Generations；图生图/图片编辑按模型能力选择多模态 Chat Completions 或 Images Edits。

接入时不要只按模型名称判断能力。建议把模型按业务用途分为三类：

- 提示词/文本模型：只用于文本生成、提示词改写、结构化规划，例如 `gpt-5.5`、`deepseek-chat`、`deepseek-reasoner`。
- 文生图模型：只输入文本 `prompt`，输出图片，例如 `gpt-image-2`、`nanobanana`、`nanobanana-pro`、`nanobanana-2`。
- 图生图模型：输入文本指令和一张或多张图片，输出新图片。`nanobanana` 系列可通过多模态 `/v1/chat/completions` 使用。

## 1. 接入摘要

| 用途 | 方法 | 路径 | 已测试模型示例 | 返回类型 |
| --- | --- | --- | --- | --- |
| 获取可用模型 | `GET` | `/v1/models` | 全部可用模型 | OpenAI 模型列表 |
| 提示词/文本模型 | `POST` | `/v1/chat/completions` | `gpt-5.5`、`deepseek-chat`、`deepseek-reasoner`、`deepseek-v4-*` | OpenAI Chat Completion |
| 文生图模型 | `POST` | `/v1/images/generations` | `gpt-image-2`、`nanobanana`、`nanobanana-pro`、`nanobanana-2` | OpenAI Image Response |
| 图生图/图片编辑 | `POST` | `/v1/chat/completions` | `nanobanana`、`nanobanana-pro`、`nanobanana-2` | OpenAI Chat Completion，内容中包含图片 data URI |
| 标准图片编辑接口 | `POST` | `/v1/images/edits` | 取决于渠道支持 | OpenAI Image Response |

基础地址示例：

```text
BASE_URL=http://101.96.193.93:3000
API_KEY=<你的令牌>
```

所有接口都需要认证：

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

说明：`/v1/images/edits` 使用 `multipart/form-data`，不要手动设置 JSON `Content-Type`；让 HTTP 客户端自动生成 boundary。

OpenAI SDK 兼容接入时，`baseURL` 应写到 `/v1`：

```text
baseURL = http://101.96.193.93:3000/v1
```

原始 HTTP 请求时，路径需要包含 `/v1`，例如 `POST http://101.96.193.93:3000/v1/chat/completions`。

## 2. 获取模型列表

用于让应用或 agent 启动时确认当前 token 可用模型。生产接入建议不要硬编码模型清单，优先读取 `/v1/models` 后按业务白名单筛选。

```bash
curl "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $API_KEY"
```

响应示例：

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-5.5",
      "object": "model",
      "created": 0,
      "owned_by": "custom"
    }
  ]
}
```

关键字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data[].id` | string | 调用接口时传入的 `model` |
| `data[].owned_by` | string | 模型归属/供应商标识，未知自定义模型可能为 `custom` |

## 3. 提示词/文本模型接口

### 3.1 请求

```http
POST /v1/chat/completions
```

最小请求：

```json
{
  "model": "gpt-5.5",
  "messages": [
    {
      "role": "user",
      "content": "把下面的商品卖点整理成一段适合生图的英文提示词：赛博朋克橙猫、东京街头、霓虹灯、电影感"
    }
  ]
}
```

常用参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | 模型 ID，例如 `gpt-5.5`、`deepseek-chat`、`deepseek-reasoner` |
| `messages` | array | 是 | 对话消息列表。FIM 类请求可使用 `prefix`/`suffix` 代替 messages，但普通接入应传 messages |
| `messages[].role` | string | 是 | `system`、`developer`、`user`、`assistant`、`tool` |
| `messages[].content` | string 或 array | 是 | 文本内容；多模态时可传 content parts |
| `stream` | boolean | 否 | 是否启用 SSE 流式响应，默认 `false` |
| `stream_options.include_usage` | boolean | 否 | 流式输出中是否包含最终 usage。仅在模型/渠道支持时生效 |
| `max_tokens` | integer | 否 | 最大输出 token。对 `gpt-5*` 类模型会自动转为 `max_completion_tokens` |
| `max_completion_tokens` | integer | 否 | 最大补全 token，优先级高于 `max_tokens` |
| `reasoning_effort` | string | 否 | 推理强度，例如 `minimal`、`low`、`medium`、`high`、`xhigh`，取决于上游模型支持 |
| `response_format` | object | 否 | JSON 输出约束，例如 `{ "type": "json_object" }` 或 `json_schema` |
| `tools` | array | 否 | OpenAI function/tool calling 格式 |
| `tool_choice` | string 或 object | 否 | `none`、`auto`、`required` 或指定函数 |
| `temperature` | number | 否 | 采样温度。`gpt-5*` 渠道会过滤不支持参数，建议调用方对这类模型不要传 |
| `top_p` | number | 否 | nucleus sampling。`gpt-5*` 渠道会过滤不支持参数，建议调用方对这类模型不要传 |

多模态消息格式示例：

```json
{
  "model": "gpt-5.5",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "描述这张图，并生成适合二次生图的英文提示词"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/cat.png",
            "detail": "high"
          }
        }
      ]
    }
  ]
}
```

### 3.2 非流式响应

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1779875027,
  "model": "gpt-5.5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "A cute orange cat sitting on a neon-lit cyberpunk street in Tokyo, cinematic lighting, highly detailed"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 32,
    "total_tokens": 57
  }
}
```

### 3.3 流式响应

请求：

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "user",
      "content": "生成 3 个英文生图提示词，主题是未来城市"
    }
  ],
  "stream": true,
  "stream_options": {
    "include_usage": true
  }
}
```

响应为 SSE：

```text
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant"},"index":0,"finish_reason":null}]}
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"Prompt 1"},"index":0,"finish_reason":null}]}
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","choices":[{"delta":{},"index":0,"finish_reason":"stop"}],"usage":{"prompt_tokens":18,"completion_tokens":42,"total_tokens":60}}
data: [DONE]
```

### 3.4 模型使用建议

| 场景 | 推荐模型 | 说明 |
| --- | --- | --- |
| 高质量提示词生成、复杂指令理解 | `gpt-5.5` | 建议少传采样参数，必要时只设置 `max_completion_tokens` 和 `reasoning_effort` |
| 通用中文/英文提示词改写 | `deepseek-chat` | 适合低成本文本改写、分类、摘要 |
| 推理型提示词规划 | `deepseek-reasoner` | 适合需要拆解约束、生成结构化方案的场景 |
| DeepSeek V4 思考控制 | `deepseek-v4-*-none`、`deepseek-v4-*-max` | `-none` 关闭 thinking，`-max` 开启 max thinking；实际可用模型以 `/v1/models` 为准 |

## 4. 生图模型接口

本节的“生图”特指文生图：只输入文本 `prompt`，不上传参考图片。

### 4.1 文生图请求

```http
POST /v1/images/generations
```

最小请求：

```json
{
  "model": "gpt-image-2",
  "prompt": "A cute orange cat sitting on a neon-lit cyberpunk street in Tokyo, cinematic lighting, highly detailed",
  "n": 1,
  "size": "1024x1024"
}
```

常用参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | 生图模型 ID，例如 `gpt-image-2`、`nanobanana`、`nanobanana-pro` |
| `prompt` | string | 是 | 生图提示词。建议使用英文或中英混合，避免空字符串 |
| `n` | integer | 否 | 生成数量，默认 `1` |
| `size` | string | 否 | 图片尺寸或比例。常用：`1024x1024`、`1024x1792`、`1792x1024`、`1536x1024`、`1024x1536`、`1:1`、`16:9` |
| `quality` | string | 否 | 质量档位。常用：`auto`、`standard`、`hd`、`low`、`medium`、`high`、`1K`、`2K`，是否生效取决于模型/渠道 |
| `response_format` | string | 否 | `url` 或 `b64_json`，默认取决于上游渠道 |
| `background` | string/object | 否 | 背景设置，例如 `opaque`、`transparent`，是否支持取决于模型 |
| `output_format` | string | 否 | 输出格式，例如 `png`、`jpeg`、`webp` |
| `output_compression` | integer | 否 | 输出压缩质量，通常用于 jpeg/webp |
| `watermark` | boolean | 否 | 是否加水印，是否支持取决于模型 |
| `moderation` | string/object | 否 | 审核策略，是否支持取决于模型 |
| `extra_fields` | object | 否 | 上游私有参数透传字段 |

尺寸注意事项：

- 使用 `x`，不要使用乘号 `×` 或中文编码后的 `脳`。
- 如果模型映射到 Gemini Imagen，`size` 也可用比例格式，如 `1:1`、`16:9`、`9:16`、`3:2`、`2:3`。
- 不同上游支持的尺寸不同，接入应用应允许服务端返回 400 并把错误信息展示给管理员。

### 4.2 文生图请求示例

`gpt-image-2`：

```bash
curl "$BASE_URL/v1/images/generations" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "A cute orange cat sitting on a neon-lit cyberpunk street in Tokyo, cinematic lighting, highly detailed",
    "n": 1,
    "size": "1024x1024",
    "quality": "auto",
    "output_format": "png"
  }'
```

`nanobanana`：

```bash
curl "$BASE_URL/v1/images/generations" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nanobanana",
    "prompt": "Product photo of a minimalist ceramic coffee cup on a clean desk, soft morning light, premium commercial photography",
    "n": 1,
    "size": "1:1",
    "quality": "high",
    "response_format": "url"
  }'
```

### 4.3 文生图响应

URL 返回示例：

```json
{
  "created": 1779875027,
  "background": "opaque",
  "data": [
    {
      "url": "https://example.com/image-generation-1779875072944089920.png"
    }
  ],
  "output_format": "png",
  "quality": "auto",
  "size": "1024x1024",
  "usage": {
    "input_tokens": 25,
    "input_tokens_details": {
      "text_tokens": 25
    },
    "output_tokens": 765,
    "output_tokens_details": {
      "image_tokens": 765
    },
    "total_tokens": 790
  }
}
```

Base64 返回示例：

```json
{
  "created": 1779875027,
  "data": [
    {
      "b64_json": "<base64 image data>"
    }
  ]
}
```

关键字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data[].url` | string | 生成图片 URL。`response_format=url` 或上游默认 URL 时返回 |
| `data[].b64_json` | string | Base64 图片数据。`response_format=b64_json` 或部分渠道默认 Base64 时返回 |
| `data[].revised_prompt` | string | 上游改写后的提示词，存在时可用于回显 |
| `usage` | object | token/图片计费用量。不同渠道字段可能不同，应用应兼容缺省 |
| `background`、`output_format`、`quality`、`size` | string | 上游返回的图片配置回显，可能不存在 |

应用解析建议：

```ts
const image = response.data?.[0]
const imageUrl = image?.url
const imageBase64 = image?.b64_json

if (!imageUrl && !imageBase64) {
  throw new Error('No image returned from image generation API')
}
```

### 4.4 图生图/图片编辑

图生图指“输入图片 + 文本指令，输出新图片”。当前推荐的 `nanobanana` 系列调用方式是多模态 Chat Completions：

```http
POST /v1/chat/completions
Content-Type: application/json
```

最小请求示例：

```json
{
  "model": "nanobanana",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "把这张图改成白色背景、高质量商品图风格"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,<输入图片base64>"
          }
        }
      ]
    }
  ],
  "stream": false
}
```

`curl` 示例：

```bash
curl "$BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nanobanana",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "把这张图改成白色背景、高质量商品图风格"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,<输入图片base64>"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

响应读取方式：

- 非流式读取 `choices[0].message.content`。
- 如果模型返回图片，内容通常包含 markdown 图片，例如 `![image](data:image/png;base64,...)`。
- 调用方可以从 `data:image/...;base64,...` 中取出 base64 后保存或渲染。

注意事项：

- 推荐传 `data:image/png;base64,...` 或 `data:image/jpeg;base64,...`，不要优先传远程 URL。
- 远程 `image_url.url` 会由服务端下载，可能被 SSRF 防护拦截。若域名解析到私有 IP，会返回 `private IP address not allowed`。
- `image` 不是模型名。在 `/v1/images/edits` 中，`image` 是上传文件字段；`nanobanana` 才是模型 ID。
- `gpt-image-2` 和 `nanobanana` 不是同一个上游模型。它们只是都属于图片能力模型，可以共用 OpenAI-compatible 接口风格。

标准 OpenAI-compatible 图片编辑接口是：

```http
POST /v1/images/edits
Content-Type: multipart/form-data
```

form-data 示例：

```text
model=nanobanana
prompt=把这张图改成白色背景、高质量商品图风格
image=@input.png
n=1
size=1024x1024
response_format=b64_json
```

该接口是否可用于某个模型，取决于对应渠道是否实现了图片编辑适配。若使用 `nanobanana` 系列遇到转换或 multipart 相关错误，优先改用上面的多模态 `/v1/chat/completions` 方式。

## 5. Agent 接入速记

可直接给 Codex 或其他 agent 的最小规范：

```text
你需要接入一个 OpenAI-compatible API gateway。

环境变量：
- API_BASE_URL: 例如 http://101.96.193.93:3000
- API_KEY: Bearer token

认证：
- 所有请求都带 Authorization: Bearer ${API_KEY}
- JSON 请求带 Content-Type: application/json

模型发现：
- GET ${API_BASE_URL}/v1/models
- 使用 data[].id 作为 model

模型能力区分：
- 提示词/文本模型：`gpt-5.5`、`deepseek-chat`、`deepseek-reasoner`、`deepseek-v4-*`。只用于文本、提示词生成和改写。
- 文生图模型：`gpt-image-2`、`nanobanana`、`nanobanana-pro`、`nanobanana-2`。只输入文本 prompt，输出图片。
- 图生图模型：`nanobanana`、`nanobanana-pro`、`nanobanana-2`。输入文本指令和图片，输出新图片。

提示词/文本：
- POST ${API_BASE_URL}/v1/chat/completions
- body: { "model": "gpt-5.5" 或 "deepseek-chat", "messages": [{ "role": "user", "content": "..." }] }
- 非流式读 choices[0].message.content
- 流式按 SSE 解析 data 行，直到 [DONE]

文生图：
- POST ${API_BASE_URL}/v1/images/generations
- body: { "model": "gpt-image-2" 或 "nanobanana", "prompt": "...", "n": 1, "size": "1024x1024" }
- 优先读取 data[0].url；如果没有 url，读取 data[0].b64_json

图生图：
- 推荐 POST ${API_BASE_URL}/v1/chat/completions
- body 使用多模态 messages，文本指令放 type=text，输入图片放 type=image_url
- image_url.url 优先使用 data:image/png;base64,...，不要优先使用远程 URL
- 非流式读 choices[0].message.content；如果返回 markdown 图片，从 data:image/...;base64,... 中提取图片
- 不要把提示词/文本模型用于生图或图生图，不要把图片模型用于普通文本提示词生成

错误：
- 非 2xx 时解析 { "error": { "message": "...", "type": "...", "param": "...", "code": "..." } }
```

## 6. TypeScript 接入示例

原始 `fetch`：

```ts
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://101.96.193.93:3000'
const API_KEY = process.env.API_KEY!

async function chat(prompt: string) {
  const res = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.5',
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 800,
    }),
  })

  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

async function generateImage(prompt: string) {
  const res = await fetch(`${API_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    }),
  })

  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  const first = json.data?.[0]
  return first?.url ?? first?.b64_json
}

async function editImageWithNanobanana(prompt: string, imageBase64: string, mimeType = 'image/png') {
  const res = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nanobanana',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      stream: false,
    }),
  })

  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  const content = json.choices?.[0]?.message?.content ?? ''
  const match = content.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/)
  return match ? { mimeType: match[1], base64: match[2] } : { text: content }
}
```

OpenAI SDK 风格：

```ts
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: `${process.env.API_BASE_URL}/v1`,
})

const completion = await client.chat.completions.create({
  model: 'gpt-5.5',
  messages: [{ role: 'user', content: '生成一个赛博朋克橙猫的英文生图提示词' }],
})

const image = await client.images.generate({
  model: 'gpt-image-2',
  prompt: completion.choices[0]?.message?.content ?? '',
  n: 1,
  size: '1024x1024',
})
```

## 7. Python 接入示例

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["API_KEY"],
    base_url=os.environ.get("API_BASE_URL", "http://101.96.193.93:3000") + "/v1",
)

completion = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "user", "content": "生成一个未来城市主题的英文生图提示词"}
    ],
)

prompt = completion.choices[0].message.content

image = client.images.generate(
    model="gpt-image-2",
    prompt=prompt,
    n=1,
    size="1024x1024",
)

first = image.data[0]
print(getattr(first, "url", None) or getattr(first, "b64_json", None))
```

## 8. 错误响应

通用错误结构：

```json
{
  "error": {
    "message": "model is required",
    "type": "invalid_request_error",
    "param": "model",
    "code": "invalid_request"
  }
}
```

常见错误处理：

| HTTP 状态 | 常见原因 | 建议处理 |
| --- | --- | --- |
| `400` | 参数缺失、尺寸不支持、上游拒绝 | 将 `error.message` 展示给调用方或管理员 |
| `401` | token 缺失或无效 | 检查 `Authorization` |
| `403` | token 无权访问模型/分组 | 重新分配模型或更换 token |
| `429` | 频率限制或额度不足 | 指数退避重试，或提示用户稍后再试 |
| `500/502` | 上游异常或网关转发异常 | 记录请求 ID、模型、错误信息后重试或切换模型 |

## 9. 接入检查清单

- 启动时调用 `/v1/models`，确认 `gpt-image-2`、`nanobanana`、`gpt-5.5`、`deepseek-*` 是否在当前 token 可用范围内。
- 在 agent 或应用内部维护模型用途白名单：提示词模型、生图模型、图生图模型分开选择。
- 文本模型非流式读取 `choices[0].message.content`，流式按 SSE `data:` 行解析。
- 文生图调用 `/v1/images/generations`，结果同时兼容 `data[0].url` 和 `data[0].b64_json`。
- `nanobanana` 图生图优先调用 `/v1/chat/completions` 多模态消息，并从返回内容中的 `data:image/...;base64,...` 提取图片。
- 图生图输入图片优先使用 data URI，避免远程 URL 被 SSRF 防护拦截。
- 生图尺寸只使用 ASCII `x`，例如 `1024x1024`。
- 对 `usage` 字段做可选解析，不要假设每个渠道都返回完全一致的 token 明细。
- 对 `gpt-5*` 类模型优先使用 `max_completion_tokens`、`reasoning_effort`，避免依赖 `temperature`、`top_p`。
- 所有错误都读取并记录 `error.message`，便于定位上游参数或额度问题。
