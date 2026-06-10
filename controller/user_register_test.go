package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/gin-gonic/gin"
)

type registerTestResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func withRegisterSettings(t *testing.T) {
	t.Helper()

	prevRegisterEnabled := common.RegisterEnabled
	prevPasswordRegisterEnabled := common.PasswordRegisterEnabled
	prevEmailVerificationEnabled := common.EmailVerificationEnabled
	prevTranslateMessage := common.TranslateMessage

	common.RegisterEnabled = true
	common.PasswordRegisterEnabled = true
	common.EmailVerificationEnabled = true
	if err := i18n.Init(); err != nil {
		t.Fatalf("failed to initialize i18n: %v", err)
	}
	common.TranslateMessage = i18n.T

	t.Cleanup(func() {
		common.RegisterEnabled = prevRegisterEnabled
		common.PasswordRegisterEnabled = prevPasswordRegisterEnabled
		common.EmailVerificationEnabled = prevEmailVerificationEnabled
		common.TranslateMessage = prevTranslateMessage
	})
}

func performRegisterRequest(t *testing.T, body string) registerTestResponse {
	t.Helper()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/user/register", strings.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	Register(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", recorder.Code)
	}

	var response registerTestResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	return response
}

func TestRegisterExplainsVerificationCodeMustMatchCurrentEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	withRegisterSettings(t)

	common.RegisterVerificationCodeWithKey("984601612@qq.com", "758531", common.EmailVerificationPurpose)

	response := performRegisterRequest(t, `{
		"username": "test2",
		"password": "password123",
		"email": "984601612@qqq.com",
		"verification_code": "758531"
	}`)

	if response.Success {
		t.Fatal("expected mismatched email verification to be rejected")
	}
	const expected = "The verification code does not match the current email address or has expired. Please confirm the email address that received the code."
	if response.Message != expected {
		t.Fatalf("expected message %q, got %q", expected, response.Message)
	}
}
