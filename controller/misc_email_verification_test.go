package controller

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

type emailVerificationTestResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func performEmailVerificationRequest(t *testing.T, email string) emailVerificationTestResponse {
	t.Helper()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)

	query := url.Values{}
	query.Set("email", email)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/verification?"+query.Encode(), nil)

	SendEmailVerification(ctx)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d", recorder.Code)
	}

	var response emailVerificationTestResponse
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	return response
}

func restoreEmailRestrictionSettings(t *testing.T) {
	t.Helper()

	prevDomainRestriction := common.EmailDomainRestrictionEnabled
	prevAliasRestriction := common.EmailAliasRestrictionEnabled
	prevWhitelist := append([]string(nil), common.EmailDomainWhitelist...)

	t.Cleanup(func() {
		common.EmailDomainRestrictionEnabled = prevDomainRestriction
		common.EmailAliasRestrictionEnabled = prevAliasRestriction
		common.EmailDomainWhitelist = prevWhitelist
	})
}

func TestSendEmailVerificationRejectsInvalidEmailWithFriendlyMessage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	restoreEmailRestrictionSettings(t)
	common.EmailDomainRestrictionEnabled = false
	common.EmailAliasRestrictionEnabled = false

	response := performEmailVerificationRequest(t, "not-an-email")

	if response.Success {
		t.Fatal("expected invalid email to be rejected")
	}
	const expected = "Please enter a valid email address"
	if response.Message != expected {
		t.Fatalf("expected message %q, got %q", expected, response.Message)
	}
}

func TestSendEmailVerificationRejectsDomainOutsideWhitelistWithPreciseMessage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	restoreEmailRestrictionSettings(t)
	common.EmailDomainRestrictionEnabled = true
	common.EmailAliasRestrictionEnabled = false
	common.EmailDomainWhitelist = []string{"gmail.com"}

	response := performEmailVerificationRequest(t, "test@qqq.com")

	if response.Success {
		t.Fatal("expected domain outside whitelist to be rejected")
	}
	const expected = "Email domain qqq.com is not allowed. Please check whether the email address was typed correctly or use an allowed email domain."
	if response.Message != expected {
		t.Fatalf("expected message %q, got %q", expected, response.Message)
	}
}

func TestSendEmailVerificationRejectsAliasAddressWithPreciseMessage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	restoreEmailRestrictionSettings(t)
	common.EmailDomainRestrictionEnabled = false
	common.EmailAliasRestrictionEnabled = true

	response := performEmailVerificationRequest(t, "first.last@gmail.com")

	if response.Success {
		t.Fatal("expected alias address to be rejected")
	}
	const expected = "Email aliases are not allowed. Please use an address without + or . before @."
	if response.Message != expected {
		t.Fatalf("expected message %q, got %q", expected, response.Message)
	}
}
