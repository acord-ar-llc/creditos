package handler

import (
	"net/http"

	"github.com/diogenes-moreira/creditos/backend/internal/application/dto"
	"github.com/diogenes-moreira/creditos/backend/internal/application/service"
	"github.com/diogenes-moreira/creditos/backend/internal/domain/port"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ClientHandler struct {
	clientService   *service.ClientService
	creditService   *service.CreditService
	paymentService  *service.PaymentService
	purchaseRepo    port.PurchaseRepository
	accountRepo     port.AccountRepository
	movementRepo    port.MovementRepository
}

func NewClientHandler(
	clientService *service.ClientService,
	creditService *service.CreditService,
	paymentService *service.PaymentService,
	purchaseRepo port.PurchaseRepository,
	accountRepo port.AccountRepository,
	movementRepo port.MovementRepository,
) *ClientHandler {
	return &ClientHandler{
		clientService:  clientService,
		creditService:  creditService,
		paymentService: paymentService,
		purchaseRepo:   purchaseRepo,
		accountRepo:    accountRepo,
		movementRepo:   movementRepo,
	}
}

// GetProfile godoc
// @Summary Get current client profile
// @Description Returns the profile of the currently authenticated client
// @Tags Client Profile
// @Produce json
// @Success 200 {object} dto.ClientResponse
// @Failure 404 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /me/profile [get]
func (h *ClientHandler) GetProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	client, err := h.clientService.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "client not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToClientResponse(client, client.User.Email))
}

// UpdateProfile godoc
// @Summary Update current client profile
// @Description Updates the contact information of the currently authenticated client
// @Tags Client Profile
// @Accept json
// @Produce json
// @Param request body dto.UpdateProfileRequest true "Profile update data"
// @Success 200 {object} dto.ClientResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /me/profile [put]
func (h *ClientHandler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	client, err := h.clientService.UpdateProfile(c.Request.Context(), userID, req.Phone, req.Address, req.City, req.Province, req.Country)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToClientResponse(client, client.User.Email))
}

// SetMercadoPagoLink godoc
// @Summary Update MercadoPago payment link
// @Description Sets or updates the MercadoPago payment link for the authenticated client
// @Tags Client Profile
// @Accept json
// @Produce json
// @Param request body dto.MercadoPagoLinkRequest true "MercadoPago link"
// @Success 200 {object} map[string]string
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /me/mercadopago [put]
func (h *ClientHandler) SetMercadoPagoLink(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	var req dto.MercadoPagoLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	if err := h.clientService.SetMercadoPagoLink(c.Request.Context(), userID, req.Link); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "MercadoPago link updated"})
}

// AdminRegisterClient godoc
// @Summary Register a new client
// @Description Admin creates a client account with all personal data
// @Tags Admin Clients
// @Accept json
// @Produce json
// @Param request body dto.RegisterRequest true "Client registration data"
// @Success 201 {object} dto.ClientResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients [post]
func (h *ClientHandler) AdminRegisterClient(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	client, user, err := h.clientService.Register(
		c.Request.Context(),
		req.Email,
		req.FirstName, req.LastName,
		req.DNI, req.CUIT, req.DateOfBirth,
		req.Phone, req.Address, req.City, req.Province, req.Country,
		req.IsPEP,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto.ToClientResponse(client, user.Email))
}

// ListClients godoc
// @Summary List or search clients
// @Description Returns a paginated list of clients, optionally filtered by a search query
// @Tags Admin Clients
// @Produce json
// @Param q query string false "Search query (name, DNI, CUIT)"
// @Param offset query int false "Pagination offset" default(0)
// @Param limit query int false "Pagination limit" default(20)
// @Success 200 {object} dto.PaginatedResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients [get]
func (h *ClientHandler) ListClients(c *gin.Context) {
	var req dto.SearchClientsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}
	clients, total, err := h.clientService.Search(c.Request.Context(), req.Query, req.Offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	responses := make([]dto.ClientResponse, len(clients))
	for i, cl := range clients {
		responses[i] = dto.ToClientResponse(&cl, cl.User.Email)
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: responses, Total: total, Offset: req.Offset, Limit: req.Limit})
}

// GetClient godoc
// @Summary Get a client by ID
// @Description Returns the details of a specific client by their UUID
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} dto.ClientResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients/{id} [get]
func (h *ClientHandler) GetClient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	client, err := h.clientService.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "client not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToClientResponse(client, client.User.Email))
}

// UpdateIVARate godoc
// @Summary Update IVA rate for a client
// @Tags Admin Clients
// @Accept json
// @Produce json
// @Param id path string true "Client UUID"
// @Param request body dto.UpdateIVARateRequest true "IVA rate"
// @Success 200 {object} dto.ClientResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/iva-rate [put]
func (h *ClientHandler) UpdateIVARate(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	var req dto.UpdateIVARateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	client, err := h.clientService.UpdateIVARate(c.Request.Context(), adminID, clientID, req.IVARate)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToClientResponse(client, client.User.Email))
}

// UpdateComments godoc
// @Summary Update comments for a client
// @Tags Admin Clients
// @Accept json
// @Produce json
// @Param id path string true "Client UUID"
// @Param request body dto.UpdateCommentsRequest true "Comments"
// @Success 200 {object} dto.ClientResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/comments [put]
func (h *ClientHandler) UpdateComments(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	var req dto.UpdateCommentsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	client, err := h.clientService.UpdateComments(c.Request.Context(), adminID, clientID, req.Comments)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToClientResponse(client, client.User.Email))
}

// AdminUpdateClient godoc
// @Summary Update all client data
// @Description Admin updates any client field (name, DNI, CUIT, phone, address, etc.)
// @Tags Admin Clients
// @Accept json
// @Produce json
// @Param id path string true "Client UUID"
// @Param request body dto.AdminUpdateClientRequest true "Client data"
// @Success 200 {object} dto.ClientResponse
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients/{id} [put]
func (h *ClientHandler) AdminUpdateClient(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	var req dto.AdminUpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	client, err := h.clientService.AdminUpdateClient(
		c.Request.Context(), adminID, clientID,
		req.FirstName, req.LastName, req.DNI, req.CUIT,
		req.Phone, req.Address, req.City, req.Province, req.Country, req.IsPEP,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToClientResponse(client, client.User.Email))
}

// BlockClient godoc
// @Summary Block a client
// @Description Blocks a client account, preventing them from performing operations
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/block [post]
func (h *ClientHandler) BlockClient(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	if err := h.clientService.Block(c.Request.Context(), adminID, clientID); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "client blocked"})
}

// UnblockClient godoc
// @Summary Unblock a client
// @Description Unblocks a previously blocked client account
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/unblock [post]
func (h *ClientHandler) UnblockClient(c *gin.Context) {
	adminID := c.MustGet("userID").(uuid.UUID)
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	if err := h.clientService.Unblock(c.Request.Context(), adminID, clientID); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "client unblocked"})
}

// GetClientLoans godoc
// @Summary Get loans for a client
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} dto.PaginatedResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/loans [get]
func (h *ClientHandler) GetClientLoans(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	var req dto.PaginationRequest
	_ = c.ShouldBindQuery(&req)
	if req.Limit <= 0 {
		req.Limit = 20
	}
	loans, total, err := h.creditService.GetLoansByClient(c.Request.Context(), clientID, req.Offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: dto.ToLoanResponses(loans), Total: total, Offset: req.Offset, Limit: req.Limit})
}

// GetClientCreditLines godoc
// @Summary Get credit lines for a client
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {array} dto.CreditLineResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/credit-lines [get]
func (h *ClientHandler) GetClientCreditLines(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	cls, err := h.creditService.GetCreditLinesByClient(c.Request.Context(), clientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.ToCreditLineResponses(cls))
}

// GetClientPayments godoc
// @Summary Get payments for a client
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} dto.PaginatedResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/payments [get]
func (h *ClientHandler) GetClientPayments(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	var req dto.PaginationRequest
	_ = c.ShouldBindQuery(&req)
	if req.Limit <= 0 {
		req.Limit = 20
	}
	payments, total, err := h.paymentService.GetPaymentsByClient(c.Request.Context(), clientID, req.Offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: dto.ToPaymentResponses(payments), Total: total, Offset: req.Offset, Limit: req.Limit})
}

// GetClientPurchases godoc
// @Summary Get purchases for a client
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} dto.PaginatedResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/purchases [get]
func (h *ClientHandler) GetClientPurchases(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	var req dto.PaginationRequest
	_ = c.ShouldBindQuery(&req)
	if req.Limit <= 0 {
		req.Limit = 20
	}
	purchases, total, err := h.purchaseRepo.FindByClientID(c.Request.Context(), clientID, req.Offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: dto.ToPurchaseResponses(purchases), Total: total, Offset: req.Offset, Limit: req.Limit})
}

// GetClientAccount godoc
// @Summary Get account for a client
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} dto.AccountResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/account [get]
func (h *ClientHandler) GetClientAccount(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	account, err := h.accountRepo.FindByClientID(c.Request.Context(), clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "account not found"})
		return
	}
	c.JSON(http.StatusOK, dto.ToAccountResponse(account))
}

// GetClientMovements godoc
// @Summary Get account movements for a client
// @Tags Admin Clients
// @Produce json
// @Param id path string true "Client UUID"
// @Success 200 {object} dto.PaginatedResponse
// @Security BearerAuth
// @Router /admin/clients/{id}/account/movements [get]
func (h *ClientHandler) GetClientMovements(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid client ID"})
		return
	}
	account, err := h.accountRepo.FindByClientID(c.Request.Context(), clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "account not found"})
		return
	}
	var req dto.PaginationRequest
	_ = c.ShouldBindQuery(&req)
	if req.Limit <= 0 {
		req.Limit = 20
	}
	movements, total, err := h.movementRepo.FindByAccountID(c.Request.Context(), account.ID, req.Offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: dto.ToMovementResponses(movements), Total: total, Offset: req.Offset, Limit: req.Limit})
}
