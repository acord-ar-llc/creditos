package handler

import (
	"net/http"
	"time"

	"github.com/diogenes-moreira/creditos/backend/internal/application/dto"
	"github.com/diogenes-moreira/creditos/backend/internal/application/service"
	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService *service.DashboardService
}

func NewDashboardHandler(dashboardService *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboardService: dashboardService}
}

// GetPortfolio godoc
// @Summary Get portfolio summary
// @Description Returns portfolio statistics including total clients, active loans, disbursed and outstanding amounts
// @Tags Dashboard
// @Produce json
// @Success 200 {object} dto.PortfolioResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/dashboard/portfolio [get]
func (h *DashboardHandler) GetPortfolio(c *gin.Context) {
	portfolio, err := h.dashboardService.GetPortfolio(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.PortfolioResponse{
		TotalClients:     portfolio.TotalClients,
		ActiveLoans:      portfolio.ActiveLoans,
		TotalDisbursed:   portfolio.TotalDisbursed.StringFixed(2),
		TotalOutstanding: portfolio.TotalOutstanding.StringFixed(2),
		TotalCollected:   portfolio.TotalCollected.StringFixed(2),
		PendingApprovals: portfolio.PendingApprovals,
	})
}

// GetDelinquency godoc
// @Summary Get delinquency statistics
// @Description Returns delinquency metrics including PAR30, PAR60, PAR90, and overall delinquency rate
// @Tags Dashboard
// @Produce json
// @Success 200 {object} dto.DelinquencyResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/dashboard/delinquency [get]
func (h *DashboardHandler) GetDelinquency(c *gin.Context) {
	stats, err := h.dashboardService.GetDelinquency(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.DelinquencyResponse{
		PAR30:           stats.PAR30.StringFixed(2),
		PAR60:           stats.PAR60.StringFixed(2),
		PAR90:           stats.PAR90.StringFixed(2),
		TotalOverdue:    stats.TotalOverdue.StringFixed(2),
		OverdueCount:    stats.OverdueCount,
		DelinquencyRate: stats.DelinquencyRate.StringFixed(2),
	})
}

// GetKPIs godoc
// @Summary Get combined KPIs
// @Description Returns combined portfolio and delinquency KPIs in a single response
// @Tags Dashboard
// @Produce json
// @Success 200 {object} dto.KPIResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/dashboard/kpis [get]
func (h *DashboardHandler) GetKPIs(c *gin.Context) {
	portfolio, delinquency, err := h.dashboardService.GetKPIs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.KPIResponse{
		Portfolio: dto.PortfolioResponse{
			TotalClients:     portfolio.TotalClients,
			ActiveLoans:      portfolio.ActiveLoans,
			TotalDisbursed:   portfolio.TotalDisbursed.StringFixed(2),
			TotalOutstanding: portfolio.TotalOutstanding.StringFixed(2),
			TotalCollected:   portfolio.TotalCollected.StringFixed(2),
			PendingApprovals: portfolio.PendingApprovals,
		},
		Delinquency: dto.DelinquencyResponse{
			PAR30:           delinquency.PAR30.StringFixed(2),
			PAR60:           delinquency.PAR60.StringFixed(2),
			PAR90:           delinquency.PAR90.StringFixed(2),
			TotalOverdue:    delinquency.TotalOverdue.StringFixed(2),
			OverdueCount:    delinquency.OverdueCount,
			DelinquencyRate: delinquency.DelinquencyRate.StringFixed(2),
		},
	})
}

// GetOverdueInstallments godoc
// @Summary List overdue installments (collections worklist)
// @Description Returns a paginated list of overdue installments with client and loan info
// @Tags Dashboard
// @Produce json
// @Param offset query int false "Offset"
// @Param limit query int false "Limit"
// @Success 200 {object} dto.PaginatedResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/collections/overdue [get]
func (h *DashboardHandler) GetOverdueInstallments(c *gin.Context) {
	var req dto.PaginationRequest
	_ = c.ShouldBindQuery(&req)
	if req.Limit <= 0 {
		req.Limit = 20
	}
	items, total, err := h.dashboardService.GetOverdueInstallments(c.Request.Context(), req.Offset, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	now := time.Now()
	result := make([]dto.OverdueInstallmentResponse, len(items))
	for i, it := range items {
		days := int(now.Sub(it.DueDate).Hours() / 24)
		if days < 0 {
			days = 0
		}
		result[i] = dto.OverdueInstallmentResponse{
			InstallmentID:   it.InstallmentID.String(),
			LoanID:          it.LoanID.String(),
			ClientID:        it.ClientID.String(),
			ClientName:      it.ClientName,
			Number:          it.Number,
			DueDate:         it.DueDate.Format("2006-01-02"),
			DaysOverdue:     days,
			TotalAmount:     it.TotalAmount.StringFixed(2),
			RemainingAmount: it.RemainingAmount.StringFixed(2),
			Status:          it.Status,
		}
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: result, Total: total, Offset: req.Offset, Limit: req.Limit})
}

// GetDisbursementTrend godoc
// @Summary Get disbursement trends
// @Description Returns monthly disbursement trend data for the last 12 months
// @Tags Dashboard
// @Produce json
// @Success 200 {array} dto.TrendPointResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/dashboard/trends/disbursements [get]
func (h *DashboardHandler) GetDisbursementTrend(c *gin.Context) {
	points, err := h.dashboardService.GetDisbursementTrend(c.Request.Context(), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	result := make([]dto.TrendPointResponse, len(points))
	for i, p := range points {
		result[i] = dto.TrendPointResponse{Date: p.Date, Amount: p.Amount.StringFixed(2), Count: p.Count}
	}
	c.JSON(http.StatusOK, result)
}

// GetCollectionTrend godoc
// @Summary Get collection trends
// @Description Returns monthly collection trend data for the last 12 months
// @Tags Dashboard
// @Produce json
// @Success 200 {array} dto.TrendPointResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /admin/dashboard/trends/collections [get]
func (h *DashboardHandler) GetCollectionTrend(c *gin.Context) {
	points, err := h.dashboardService.GetCollectionTrend(c.Request.Context(), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	result := make([]dto.TrendPointResponse, len(points))
	for i, p := range points {
		result[i] = dto.TrendPointResponse{Date: p.Date, Amount: p.Amount.StringFixed(2), Count: p.Count}
	}
	c.JSON(http.StatusOK, result)
}
