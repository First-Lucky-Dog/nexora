package gemini

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/relay/channel/openai"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	relayconstant "github.com/QuantumNous/new-api/relay/constant"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func testGinContext(path string) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, path, nil)
	return c, recorder
}

func testHTTPResponse(body []byte) *http.Response {
	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     make(http.Header),
		Body:       io.NopCloser(bytes.NewReader(body)),
	}
}

func TestGeminiConvertImageRequestKeepsImagenPredictPayloadAndURL(t *testing.T) {
	c, _ := testGinContext("/v1/images/generations")
	adaptor := &Adaptor{}
	info := &relaycommon.RelayInfo{
		RelayMode: relayconstant.RelayModeImagesGenerations,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl:    "https://generativelanguage.googleapis.com",
			UpstreamModelName: "imagen-4.0-generate-001",
		},
	}

	n := uint(2)
	converted, err := adaptor.ConvertImageRequest(c, info, dto.ImageRequest{
		Model:  "imagen-4.0-generate-001",
		Prompt: "robot holding a skateboard",
		N:      &n,
		Size:   "1024x1024",
	})
	require.NoError(t, err)

	imagenReq, ok := converted.(dto.GeminiImageRequest)
	require.True(t, ok)
	require.Equal(t, "robot holding a skateboard", imagenReq.Instances[0].Prompt)
	require.Equal(t, 2, imagenReq.Parameters.SampleCount)
	require.Equal(t, "1:1", imagenReq.Parameters.AspectRatio)

	url, err := adaptor.GetRequestURL(info)
	require.NoError(t, err)
	require.Equal(t, "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict", url)
}

func TestGeminiConvertImageRequestUsesGenerateContentForSupportedImageModel(t *testing.T) {
	c, _ := testGinContext("/v1/images/generations")
	adaptor := &Adaptor{}
	info := &relaycommon.RelayInfo{
		RelayMode: relayconstant.RelayModeImagesGenerations,
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelBaseUrl:    "https://generativelanguage.googleapis.com",
			UpstreamModelName: "gemini-3.1-flash-image-preview[metered]",
		},
	}

	converted, err := adaptor.ConvertImageRequest(c, info, dto.ImageRequest{
		Model:  "nanobanana-2-metered",
		Prompt: "create a banana robot product photo",
		Size:   "1024x1024",
	})
	require.NoError(t, err)
	require.Equal(t, "gemini-3.1-flash-image-preview", info.UpstreamModelName)

	geminiReq, ok := converted.(*dto.GeminiChatRequest)
	require.True(t, ok)
	require.Equal(t, "user", geminiReq.Contents[0].Role)
	require.Equal(t, "create a banana robot product photo", geminiReq.Contents[0].Parts[0].Text)
	require.Equal(t, []string{"IMAGE"}, geminiReq.GenerationConfig.ResponseModalities)
	var responseFormat map[string]map[string]string
	require.NoError(t, common.Unmarshal(geminiReq.GenerationConfig.ResponseFormat, &responseFormat))
	require.Equal(t, "1:1", responseFormat["image"]["aspectRatio"])

	url, err := adaptor.GetRequestURL(info)
	require.NoError(t, err)
	require.Equal(t, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent", url)
	require.NotContains(t, url, "[metered]")
}

func TestGeminiImageGenerationResponseReturnsOpenAIB64JSON(t *testing.T) {
	c, recorder := testGinContext("/v1/images/generations")
	adaptor := &Adaptor{}
	info := &relaycommon.RelayInfo{
		RelayMode:       relayconstant.RelayModeImagesGenerations,
		RelayFormat:     types.RelayFormatOpenAIImage,
		OriginModelName: "nanobanana-2",
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "gemini-3.1-flash-image-preview",
		},
	}

	payload := dto.GeminiChatResponse{
		Candidates: []dto.GeminiChatCandidate{
			{
				Content: dto.GeminiChatContent{
					Role: "model",
					Parts: []dto.GeminiPart{
						{Text: "created"},
						{InlineData: &dto.GeminiInlineData{MimeType: "image/png", Data: "image-base64"}},
					},
				},
			},
		},
		UsageMetadata: dto.GeminiUsageMetadata{
			PromptTokenCount:     12,
			CandidatesTokenCount: 34,
			TotalTokenCount:      46,
		},
	}
	body, err := common.Marshal(payload)
	require.NoError(t, err)

	usage, newAPIError := adaptor.DoResponse(c, testHTTPResponse(body), info)
	require.Nil(t, newAPIError)
	require.NotNil(t, usage)

	var imageResp dto.ImageResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &imageResp))
	require.Len(t, imageResp.Data, 1)
	require.Equal(t, "image-base64", imageResp.Data[0].B64Json)
	require.NotContains(t, recorder.Body.String(), "![image]")
}

func TestGeminiChatCompletionsImageMarkdownUnchanged(t *testing.T) {
	c, recorder := testGinContext("/v1/chat/completions")
	info := &relaycommon.RelayInfo{
		RelayMode:       relayconstant.RelayModeChatCompletions,
		RelayFormat:     types.RelayFormatOpenAI,
		OriginModelName: "nanobanana-2",
		ChannelMeta: &relaycommon.ChannelMeta{
			UpstreamModelName: "gemini-3.1-flash-image-preview",
		},
	}

	payload := dto.GeminiChatResponse{
		Candidates: []dto.GeminiChatCandidate{
			{
				Content: dto.GeminiChatContent{
					Role: "model",
					Parts: []dto.GeminiPart{
						{InlineData: &dto.GeminiInlineData{MimeType: "image/png", Data: "image-base64"}},
					},
				},
			},
		},
	}
	body, err := common.Marshal(payload)
	require.NoError(t, err)

	usage, newAPIError := GeminiChatHandler(c, info, testHTTPResponse(body))
	require.Nil(t, newAPIError)
	require.NotNil(t, usage)

	var chatResp dto.OpenAITextResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &chatResp))
	require.Len(t, chatResp.Choices, 1)
	content := chatResp.Choices[0].Message.StringContent()
	require.Contains(t, content, "![image](data:image/png;base64,image-base64)")
}

func TestOpenAIImageGenerationResponsePreservesURLForGPTImage2(t *testing.T) {
	c, recorder := testGinContext("/v1/images/generations")
	info := &relaycommon.RelayInfo{
		RelayMode:       relayconstant.RelayModeImagesGenerations,
		RelayFormat:     types.RelayFormatOpenAIImage,
		OriginModelName: "gpt-image-2",
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelType:       constant.ChannelTypeOpenAI,
			UpstreamModelName: "gpt-image-2",
		},
	}

	upstreamBody := []byte(`{"created":1779949942,"data":[{"url":"https://example.com/image.png"}],"usage":{"total_tokens":1}}`)
	usage, newAPIError := openai.OpenaiImageHandler(c, info, testHTTPResponse(upstreamBody))
	require.Nil(t, newAPIError)
	require.NotNil(t, usage)

	var imageResp dto.ImageResponse
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &imageResp))
	require.Len(t, imageResp.Data, 1)
	require.Equal(t, "https://example.com/image.png", imageResp.Data[0].Url)
	require.False(t, strings.Contains(recorder.Body.String(), "b64_json"))
}
