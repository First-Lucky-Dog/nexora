# 生图模型与提示词模型接入文档

> 文档版本：v1.1.0  
> 接口风格：OpenAI-compatible API  
> 基础地址：`http://101.96.193.93:3000`

本文档用于说明文本/提示词模型与生图模型的接入方式。接口整体兼容 OpenAI 风格：文本与提示词生成使用 Chat Completions；生图模型同时支持文生图和图生图，文生图统一使用 Images Generations，图生图根据模型类型选择 Images Edits 或多模态 Chat Completions。

接入方不应仅根据模型名称判断能力。生产环境建议在应用启动时调用 `/v1/models` 获取当前 Token 可用模型，并在业务侧维护模型用途白名单。

## 1. 接入摘要

### 1.1 基础信息

| 项目 | 说明 |
| --- | --- |
| API 基础地址 | `http://101.96.193.93:3000` |
| OpenAI SDK `baseURL` | `http://101.96.193.93:3000/v1` |
| 原始 HTTP 路径前缀 | `/v1` |
| 鉴权方式 | `Authorization: Bearer <API_KEY>` |
| JSON 请求类型 | `Content-Type: application/json` |
| Multipart 请求类型 | `multipart/form-data`，由客户端自动生成 boundary |

环境变量示例：

```text
BASE_URL=http://101.96.193.93:3000
API_KEY=<你的令牌>
```

JSON 请求通用请求头：

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

`/v1/images/edits` 使用 `multipart/form-data`。调用该接口时不要手动设置 `Content-Type: application/json`，也不要手动拼接 multipart boundary，应由 Apifox、curl、SDK 或 HTTP 客户端自动生成。

### 1.2 接口能力概览

| 用途 | 方法 | 路径 | 模型示例 | 返回类型 |
| --- | --- | --- | --- | --- |
| 获取可用模型 | `GET` | `/v1/models` | 全部可用模型 | OpenAI Model List |
| 文本/提示词生成 | `POST` | `/v1/chat/completions` | `gpt-5.5`、`deepseek-chat`、`deepseek-reasoner`、`deepseek-v4-*` | OpenAI Chat Completion |
| 文生图 | `POST` | `/v1/images/generations` | `gpt-image-2`、`nanobanana`、`nanobanana-pro`、`nanobanana-2` | OpenAI Image Response |
| 图生图/图片编辑 | `POST` | `/v1/images/edits` | `gpt-image-2`、OpenAI image 类模型 | OpenAI Image Response |
| 图生图/图片编辑 | `POST` | `/v1/chat/completions` | `nanobanana`、`nanobanana-pro`、`nanobanana-2` | OpenAI Chat Completion，内容中包含图片 data URI |

### 1.3 模型能力与调用方式

| 类型 | 典型模型 | 能力 | 推荐调用方式 |
| --- | --- | --- | --- |
| 文本/提示词模型 | `gpt-5.5`、`deepseek-chat`、`deepseek-reasoner` | 文本生成、提示词改写、结构化规划、摘要、分类 | `/v1/chat/completions` |
| 生图模型 | `gpt-image-2`、`nanobanana`、`nanobanana-pro`、`nanobanana-2` | 文生图、图生图 | 文生图使用 `/v1/images/generations`；图生图按模型类型选择 `/v1/images/edits` 或 `/v1/chat/completions` |

生图模型均可覆盖以下两类业务：

| 业务类型 | 输入 | 输出 | 调用方式 |
| --- | --- | --- | --- |
| 文生图 | 文本 `prompt` | 图片 URL 或 Base64 | `/v1/images/generations` |
| 图生图 | 文本 `prompt` + 上传图片或图片 data URI | 图片 URL、Base64 或包含图片 data URI 的 Chat 内容 | `gpt-image-2` / image 类模型使用 `/v1/images/edits`；`nanobanana` 系列使用多模态 `/v1/chat/completions` |

## 2. 获取模型列表

生产环境建议在应用启动时调用 `/v1/models`，确认当前 Token 可用模型，再按业务白名单选择模型。不要在业务代码中完全硬编码模型清单。

### 2.1 请求

```bash
curl "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $API_KEY"
```

### 2.2 响应示例

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

### 2.3 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `object` | string | 固定为列表对象，通常为 `list` |
| `data[].id` | string | 调用接口时传入的 `model` |
| `data[].object` | string | 模型对象类型 |
| `data[].created` | integer | 模型创建时间，若无实际值可能为 `0` |
| `data[].owned_by` | string | 模型归属或供应商标识，未知自定义模型可能为 `custom` |

## 3. 文本/提示词模型接口

文本与提示词生成统一使用 Chat Completions 接口。

```http
POST /v1/chat/completions
```

### 3.1 最小请求

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

### 3.2 常用参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | 模型 ID，例如 `gpt-5.5`、`deepseek-chat`、`deepseek-reasoner` |
| `messages` | array | 是 | 对话消息列表。普通接入应传 `messages` |
| `messages[].role` | string | 是 | 可用值通常包括 `system`、`developer`、`user`、`assistant`、`tool` |
| `messages[].content` | string 或 array | 是 | 文本内容；多模态请求可传 content parts |
| `stream` | boolean | 否 | 是否启用 SSE 流式响应，默认 `false` |
| `stream_options.include_usage` | boolean | 否 | 流式输出中是否包含最终 `usage`，仅在模型/渠道支持时生效 |
| `max_tokens` | integer | 否 | 最大输出 token。对 `gpt-5*` 类模型可能会自动转换为 `max_completion_tokens` |
| `max_completion_tokens` | integer | 否 | 最大补全 token，优先级高于 `max_tokens` |
| `reasoning_effort` | string | 否 | 推理强度，例如 `minimal`、`low`、`medium`、`high`、`xhigh`，取决于上游模型支持 |
| `response_format` | object | 否 | JSON 输出约束，例如 `{ "type": "json_object" }` 或 `json_schema` |
| `tools` | array | 否 | OpenAI function/tool calling 格式 |
| `tool_choice` | string 或 object | 否 | `none`、`auto`、`required` 或指定函数 |
| `temperature` | number | 否 | 采样温度。部分 `gpt-5*` 渠道可能不支持，建议调用方按模型能力控制是否传入 |
| `top_p` | number | 否 | nucleus sampling。部分 `gpt-5*` 渠道可能不支持，建议调用方按模型能力控制是否传入 |

### 3.3 多模态消息格式

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

### 3.4 非流式响应

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

读取结果：

```ts
const content = response.choices?.[0]?.message?.content ?? ''
```

### 3.5 流式响应

请求示例：

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

响应格式为 SSE：

```text
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant"},"index":0,"finish_reason":null}]}
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"Prompt 1"},"index":0,"finish_reason":null}]}
data: {"id":"chatcmpl_xxx","object":"chat.completion.chunk","choices":[{"delta":{},"index":0,"finish_reason":"stop"}],"usage":{"prompt_tokens":18,"completion_tokens":42,"total_tokens":60}}
data: [DONE]
```

流式接入要求：

- 按 SSE `data:` 行解析。
- 遇到 `data: [DONE]` 表示流结束。
- 内容增量从 `choices[].delta.content` 读取。
- `usage` 可能只在最后一个 chunk 中返回，也可能不存在。

### 3.6 模型使用建议

| 场景 | 推荐模型 | 说明 |
| --- | --- | --- |
| 高质量提示词生成、复杂指令理解 | `gpt-5.5` | 建议优先使用 `max_completion_tokens` 和 `reasoning_effort`，减少不必要采样参数 |
| 通用中文/英文提示词改写 | `deepseek-chat` | 适合低成本文本改写、分类、摘要 |
| 推理型提示词规划 | `deepseek-reasoner` | 适合需要拆解约束、生成结构化方案的场景 |
| DeepSeek V4 思考控制 | `deepseek-v4-*-none`、`deepseek-v4-*-max` | `-none` 关闭 thinking，`-max` 开启 max thinking；实际可用模型以 `/v1/models` 为准 |

## 4. 文生图接口

文生图指只输入文本 `prompt`，不上传参考图片。所有生图模型均可按该方式调用，实际可用模型以 `/v1/models` 返回结果为准。

```http
POST /v1/images/generations
Content-Type: application/json
```

### 4.1 最小请求

```json
{
  "model": "gpt-image-2",
  "prompt": "A cute orange cat sitting on a neon-lit cyberpunk street in Tokyo, cinematic lighting, highly detailed",
  "n": 1,
  "size": "1024x1024"
}
```

### 4.2 常用参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | 生图模型 ID，例如 `gpt-image-2`、`nanobanana`、`nanobanana-pro` |
| `prompt` | string | 是 | 生图提示词。建议使用英文或中英混合，避免空字符串 |
| `n` | integer | 否 | 生成数量，默认 `1` |
| `size` | string | 否 | 图片尺寸或比例，例如 `1024x1024`、`1024x1792`、`1792x1024`、`1536x1024`、`1024x1536`、`1:1`、`16:9` |
| `quality` | string | 否 | 质量档位，例如 `auto`、`standard`、`hd`、`low`、`medium`、`high`、`1K`、`2K`，是否生效取决于模型/渠道 |
| `response_format` | string | 否 | `url` 或 `b64_json`，默认值取决于上游渠道 |
| `background` | string/object | 否 | 背景设置，例如 `opaque`、`transparent`，是否支持取决于模型 |
| `output_format` | string | 否 | 输出格式，例如 `png`、`jpeg`、`webp` |
| `output_compression` | integer | 否 | 输出压缩质量，通常用于 `jpeg` 或 `webp` |
| `watermark` | boolean | 否 | 是否加水印，是否支持取决于模型 |
| `moderation` | string/object | 否 | 审核策略，是否支持取决于模型 |
| `extra_fields` | object | 否 | 上游私有参数透传字段 |

尺寸传参要求：

- 使用 ASCII 字符 `x`，例如 `1024x1024`。
- 不要使用乘号 `×` 或中文编码异常字符。
- 映射到 Gemini Imagen 的模型可使用比例格式，例如 `1:1`、`16:9`、`9:16`、`3:2`、`2:3`。
- 不同上游支持的尺寸不同，调用方应兼容服务端返回的 400 错误，并向管理员展示 `error.message`。

### 4.3 请求示例

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

### 4.4 响应示例

URL 返回：

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

Base64 返回：

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

### 4.5 响应字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data[].url` | string | 生成图片 URL。`response_format=url` 或上游默认 URL 时返回 |
| `data[].b64_json` | string | Base64 图片数据。`response_format=b64_json` 或部分渠道默认 Base64 时返回 |
| `data[].revised_prompt` | string | 上游改写后的提示词，存在时可用于回显 |
| `usage` | object | token/图片计费用量。不同渠道字段可能不同，应用应兼容缺省 |
| `background`、`output_format`、`quality`、`size` | string | 上游返回的图片配置回显，可能不存在 |

解析建议：

```ts
const image = response.data?.[0]
const imageUrl = image?.url
const imageBase64 = image?.b64_json

if (!imageUrl && !imageBase64) {
  throw new Error('No image returned from image generation API')
}
```

## 5. 图生图/图片编辑接口

图生图指输入文本指令和一张或多张图片，输出新图片。所有生图模型均支持图生图能力，但不同模型的推荐调用方式不同。

| 模型类型 | 推荐接口 | 请求类型 | 图片传入方式 | 返回读取方式 |
| --- | --- | --- | --- | --- |
| `gpt-image-2` / OpenAI image 类模型 | `/v1/images/edits` | `multipart/form-data` | `image` 或 `image[]` 文件字段 | 优先读取 `data[0].b64_json`，没有则读取 `data[0].url` |
| `nanobanana` 系列 | `/v1/chat/completions` | `application/json` | 多模态 `image_url.url`，优先使用 data URI | 读取 `choices[0].message.content`，从 `data:image/...;base64,...` 中提取图片 |

### 5.1 `gpt-image-2` / image 类模型图生图

`gpt-image-2` / image 类模型的图生图使用标准 OpenAI-compatible Images Edits 接口。

```http
POST /v1/images/edits
Content-Type: multipart/form-data
```

Apifox 中 Body 选择 `form-data`，参数按以下方式填写：

| 参数名 | 类型 | 参数值 |
| --- | --- | --- |
| `model` | string | `gpt-image-2` |
| `prompt` | string | `把这张图改成白色背景、高质量商品图风格` |
| `image` | file | 上传图片文件 |
| `n` | string | `1` |
| `size` | string | `1024x1024` |
| `response_format` | string | `b64_json` |

`curl` 示例：

```bash
curl "$BASE_URL/v1/images/edits" \
  -H "Authorization: Bearer $API_KEY" \
  -F "model=gpt-image-2" \
  -F "prompt=把这张图改成白色背景、高质量商品图风格" \
  -F "image=@input.png" \
  -F "n=1" \
  -F "size=1024x1024" \
  -F "response_format=b64_json"
```

响应优先读取：

```json
data[0].b64_json
```

如果返回 URL，则读取：

```json
data[0].url
```

注意事项：

- 不要手动写 `Content-Type: application/json`。
- 不要手动写 multipart boundary，应让 Apifox、curl 或 HTTP 客户端自动生成。
- `image` 是上传文件字段，不是模型名。
- 如果上游要求 `image[]`，可将参数名从 `image` 改为 `image[]` 再测试一次；当前 New API 的 OpenAI channel 通常兼容 `image` 和 `image[]`。
- `model` 应填写实际模型 ID，例如 `gpt-image-2`；是否存在其他 image 类模型，以 `/v1/models` 返回结果为准。

### 5.2 `nanobanana` 系列图生图

`nanobanana`、`nanobanana-pro`、`nanobanana-2` 的图生图推荐使用多模态 Chat Completions。

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
- 如果模型返回图片，内容通常包含 Markdown 图片，例如 `![image](data:image/png;base64,...)`。
- 调用方可以从 `data:image/...;base64,...` 中提取 base64 后保存或渲染。

提取示例：

```ts
const content = response.choices?.[0]?.message?.content ?? ''
const match = content.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/)

if (match) {
  const mimeType = match[1]
  const base64 = match[2]
}
```

图片输入要求：

- 推荐传入 `data:image/png;base64,...` 或 `data:image/jpeg;base64,...`。
- 不建议优先传远程 URL。远程 `image_url.url` 会由服务端下载，可能被 SSRF 防护拦截。
- 若远程图片地址解析到私有 IP，服务端可能返回 `private IP address not allowed`。
- 上传或内联图片应控制文件大小，过大的图片可能导致请求被客户端、网关或上游拒绝。

## 6. Agent 接入速记

以下内容可直接提供给 Codex 或其他 agent 作为接入约束。

```text
你需要接入一个 OpenAI-compatible API gateway。

环境变量：
- API_BASE_URL: http://101.96.193.93:3000
- API_KEY: Bearer token

认证：
- 所有请求都带 Authorization: Bearer ${API_KEY}
- JSON 请求带 Content-Type: application/json
- multipart/form-data 请求由客户端自动生成 Content-Type 和 boundary

模型发现：
- GET ${API_BASE_URL}/v1/models
- 使用 data[].id 作为 model
- 不要只按模型名称判断能力，应按业务用途维护模型白名单

模型能力：
- 文本/提示词模型：gpt-5.5、deepseek-chat、deepseek-reasoner、deepseek-v4-*。
- 生图模型：gpt-image-2、nanobanana、nanobanana-pro、nanobanana-2。
- 所有生图模型均支持文生图和图生图，只是调用方式不同。

文本/提示词：
- POST ${API_BASE_URL}/v1/chat/completions
- body: { "model": "gpt-5.5" 或 "deepseek-chat", "messages": [{ "role": "user", "content": "..." }] }
- 非流式读取 choices[0].message.content
- 流式按 SSE data 行解析，直到 [DONE]

文生图：
- POST ${API_BASE_URL}/v1/images/generations
- body: { "model": "gpt-image-2" 或 "nanobanana", "prompt": "...", "n": 1, "size": "1024x1024" }
- 优先读取 data[0].url；如果没有 url，读取 data[0].b64_json

图生图：
- gpt-image-2 / image 类模型：POST ${API_BASE_URL}/v1/images/edits
- 请求类型使用 multipart/form-data
- form-data: model=gpt-image-2, prompt=..., image=@input.png, n=1, size=1024x1024, response_format=b64_json
- 不要手动写 Content-Type: application/json，不要手动写 multipart boundary
- 如果上游要求 image[]，将 image 字段改为 image[] 再测试
- 优先读取 data[0].b64_json；如果没有 b64_json，读取 data[0].url

图生图：
- nanobanana 系列：POST ${API_BASE_URL}/v1/chat/completions
- 使用多模态 messages，文本指令放 type=text，输入图片放 type=image_url
- image_url.url 优先使用 data:image/png;base64,...，不要优先使用远程 URL
- 非流式读取 choices[0].message.content
- 如果返回 Markdown 图片，从 data:image/...;base64,... 中提取图片

禁止行为：
- 不要把文本/提示词模型用于生图或图生图
- 不要把图片模型用于普通文本提示词生成
- 不要把 image 当作上传文件字段以外的固定模型名；模型 ID 以 /v1/models 返回结果为准

错误处理：
- 非 2xx 时解析 { "error": { "message": "...", "type": "...", "param": "...", "code": "..." } }
- 将 error.message 记录到日志，并展示给管理员或调用方
```

## 7. TypeScript 接入示例

### 7.1 原始 fetch

```ts
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://101.96.193.93:3000'
const API_KEY = process.env.API_KEY!

async function requestJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = json?.error?.message ?? text ?? `HTTP ${res.status}`
    throw new Error(message)
  }

  return json as T
}

async function chat(prompt: string) {
  const json = await requestJson<any>('/v1/chat/completions', {
    model: 'gpt-5.5',
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 800,
  })

  return json.choices?.[0]?.message?.content ?? ''
}

async function generateImage(prompt: string) {
  const json = await requestJson<any>('/v1/images/generations', {
    model: 'gpt-image-2',
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
  })

  const first = json.data?.[0]
  const image = first?.url ?? first?.b64_json

  if (!image) {
    throw new Error('No image returned from image generation API')
  }

  return image
}

async function editImageWithImagesEdits(
  prompt: string,
  imageFile: File | Blob,
  model = 'gpt-image-2',
) {
  const formData = new FormData()
  formData.append('model', model)
  formData.append('prompt', prompt)
  formData.append('image', imageFile)
  formData.append('n', '1')
  formData.append('size', '1024x1024')
  formData.append('response_format', 'b64_json')

  const res = await fetch(`${API_BASE_URL}/v1/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
  })

  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = json?.error?.message ?? text ?? `HTTP ${res.status}`
    throw new Error(message)
  }

  const first = json.data?.[0]
  const image = first?.b64_json ?? first?.url

  if (!image) {
    throw new Error('No image returned from image edit API')
  }

  return image
}

async function editImageWithNanobanana(
  prompt: string,
  imageBase64: string,
  mimeType = 'image/png',
) {
  const json = await requestJson<any>('/v1/chat/completions', {
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
  })

  const content = json.choices?.[0]?.message?.content ?? ''
  const match = content.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/)

  return match
    ? { mimeType: match[1], base64: match[2] }
    : { text: content }
}
```

### 7.2 OpenAI SDK 风格

```ts
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: `${process.env.API_BASE_URL ?? 'http://101.96.193.93:3000'}/v1`,
})

const completion = await client.chat.completions.create({
  model: 'gpt-5.5',
  messages: [
    {
      role: 'user',
      content: '生成一个赛博朋克橙猫的英文生图提示词',
    },
  ],
})

const prompt = completion.choices[0]?.message?.content ?? ''

const image = await client.images.generate({
  model: 'gpt-image-2',
  prompt,
  n: 1,
  size: '1024x1024',
})
```

## 8. Python 接入示例

```python
from openai import OpenAI
import os

api_base_url = os.environ.get("API_BASE_URL", "http://101.96.193.93:3000")

client = OpenAI(
    api_key=os.environ["API_KEY"],
    base_url=f"{api_base_url}/v1",
)

completion = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "user", "content": "生成一个未来城市主题的英文生图提示词"}
    ],
)

prompt = completion.choices[0].message.content or ""

image = client.images.generate(
    model="gpt-image-2",
    prompt=prompt,
    n=1,
    size="1024x1024",
)

first = image.data[0]
print(getattr(first, "url", None) or getattr(first, "b64_json", None))
```

## 9. 错误响应与处理

### 9.1 通用错误结构

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

### 9.2 常见错误

| HTTP 状态 | 常见原因 | 建议处理 |
| --- | --- | --- |
| `400` | 参数缺失、模型不支持该接口、尺寸不支持、上游拒绝 | 不建议自动重试；展示或记录 `error.message` |
| `401` | Token 缺失或无效 | 检查 `Authorization: Bearer <API_KEY>` |
| `403` | Token 无权访问模型或分组 | 检查 Token 权限、模型分组和可用模型列表 |
| `429` | 频率限制或额度不足 | 指数退避后重试，或提示用户稍后再试 |
| `500` | 服务端内部异常 | 记录模型、接口、请求 ID、错误信息后排查 |
| `502/503/504` | 上游异常、网关转发失败或超时 | 可短暂重试，必要时切换模型或渠道 |

### 9.3 生产处理建议

- 非 2xx 响应必须读取响应体，并记录 `error.message`。
- 对 `400`、`401`、`403` 不建议自动重试，应优先修正参数、Token 或权限。
- 对 `429`、`502`、`503`、`504` 可使用指数退避重试。
- 日志中建议记录接口路径、模型、HTTP 状态、错误信息和请求 ID。
- 不要在客户端日志中长期保存完整 API Key。
