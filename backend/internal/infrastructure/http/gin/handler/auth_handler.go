package handler

import (
	"log"
	"net/http"

	"github.com/diogenes-moreira/creditos/backend/internal/application/dto"
	"github.com/diogenes-moreira/creditos/backend/internal/application/service"
	"github.com/diogenes-moreira/creditos/backend/internal/domain/port"
	"github.com/diogenes-moreira/creditos/backend/internal/infrastructure/auth"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	clientService    *service.ClientService
	userRepo         port.UserRepository
	authService      *auth.LocalAuthService
	otpService       *service.OTPService
	firebaseVerifier *auth.FirebaseTokenVerifier
}

func NewAuthHandler(
	clientService *service.ClientService,
	userRepo port.UserRepository,
	authService *auth.LocalAuthService,
	otpService *service.OTPService,
	firebaseVerifier *auth.FirebaseTokenVerifier,
) *AuthHandler {
	return &AuthHandler{
		clientService:    clientService,
		userRepo:         userRepo,
		authService:      authService,
		otpService:       otpService,
		firebaseVerifier: firebaseVerifier,
	}
}

// Register godoc
// @Summary Register a new client
// @Description Creates a new user account and client profile with the provided personal information
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.RegisterRequest true "Registration data"
// @Success 201 {object} dto.AuthResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	client, user, err := h.clientService.Register(
		c.Request.Context(), req.Email,
		req.FirstName, req.LastName, req.DNI, req.CUIT, req.DateOfBirth,
		req.Phone, req.Address, req.City, req.Province, req.Country, req.IsPEP,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	token, err := h.authService.GenerateToken(user.FirebaseUID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to generate token"})
		return
	}

	_ = client
	c.JSON(http.StatusCreated, dto.AuthResponse{
		Token: token,
		User:  dto.ToUserResponse(user),
	})
}

// RequestOTP godoc
// @Summary Request an OTP code for client/vendor login
// @Description Sends a 6-digit OTP code via email or signals phone OTP (sent client-side by Firebase)
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.RequestOTPRequest true "Email/phone and channel"
// @Success 200 {object} map[string]string
// @Failure 400 {object} dto.ErrorResponse
// @Router /auth/request-otp [post]
func (h *AuthHandler) RequestOTP(c *gin.Context) {
	var req dto.RequestOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	channel := req.Channel
	if channel == "" {
		channel = "email"
	}

	if channel == "phone" {
		// For phone channel, validate the user exists but SMS is sent client-side by Firebase
		if req.Phone == "" {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "phone is required for phone channel"})
			return
		}
		_, err := h.userRepo.FindByPhone(c.Request.Context(), req.Phone)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "user not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Send SMS via Firebase client SDK", "channel": "phone"})
		return
	}

	// Email channel: existing flow
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "email is required for email channel"})
		return
	}

	if err := h.otpService.RequestOTP(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent to your email", "channel": "email"})
}

// VerifyOTP godoc
// @Summary Verify an OTP code and login
// @Description Validates the OTP code and returns a JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.VerifyOTPRequest true "Email and OTP code"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /auth/verify-otp [post]
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req dto.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	user, err := h.otpService.VerifyOTP(c.Request.Context(), req.Email, req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: err.Error()})
		return
	}

	token, err := h.authService.GenerateToken(user.FirebaseUID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, dto.AuthResponse{
		Token: token,
		User:  dto.ToUserResponse(user),
	})
}

// FirebaseLogin godoc
// @Summary Authenticate via Firebase ID token
// @Description Verifies a Firebase ID token (from Google OAuth or Phone Auth) and returns a JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body dto.FirebaseLoginRequest true "Firebase ID token"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /auth/firebase-login [post]
func (h *AuthHandler) FirebaseLogin(c *gin.Context) {
	var req dto.FirebaseLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if h.firebaseVerifier == nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{Error: "Firebase authentication is not configured"})
		return
	}

	verified, err := h.firebaseVerifier.VerifyIDToken(c.Request.Context(), req.IDToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "invalid Firebase token"})
		return
	}

	ctx := c.Request.Context()

	// Try to find user by Firebase UID first
	user, err := h.userRepo.FindByFirebaseUID(ctx, verified.UID)
	if err != nil {
		// Try by email
		if verified.Email != "" {
			user, err = h.userRepo.FindByEmail(ctx, verified.Email)
		}
		// Try by phone
		if err != nil && verified.Phone != "" {
			user, err = h.userRepo.FindByPhone(ctx, verified.Phone)
		}
		if err != nil {
			c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "no account found for this credential"})
			return
		}
		// Link Firebase UID to the found user
		user.FirebaseUID = verified.UID
		_ = h.userRepo.Update(ctx, user)
	}

	if !user.IsActive {
		log.Printf("FirebaseLogin: user %s is deactivated", user.Email)
		c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: "account is deactivated"})
		return
	}

	// Google OAuth sign-in is restricted to admins only
	if verified.SignInProvider == "google.com" && !user.IsAdmin() {
		log.Printf("FirebaseLogin: user %s (role=%s) attempted Google sign-in but is not admin", user.Email, user.Role)
		c.JSON(http.StatusForbidden, dto.ErrorResponse{Error: "Google sign-in is only available for administrators"})
		return
	}

	token, err := h.authService.GenerateToken(user.FirebaseUID, user.Email, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to generate token"})
		return
	}

	user.RecordLogin()
	_ = h.userRepo.Update(ctx, user)

	c.JSON(http.StatusOK, dto.AuthResponse{
		Token: token,
		User:  dto.ToUserResponse(user),
	})
}
