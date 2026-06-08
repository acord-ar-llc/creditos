package dto

import "time"

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Phone string `json:"phone,omitempty"`
	Role  string `json:"role"`
}

type ClientResponse struct {
	ID              string `json:"id"`
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	DNI             string `json:"dni"`
	CUIT            string `json:"cuit"`
	DateOfBirth     string `json:"dateOfBirth"`
	Phone           string `json:"phone"`
	Address         string `json:"address"`
	City            string `json:"city"`
	Province        string `json:"province"`
	Country         string `json:"country"`
	Comments        string `json:"comments,omitempty"`
	IsPEP           bool   `json:"isPEP"`
	IVARate         string `json:"ivaRate"`
	MercadoPagoLink string `json:"mercadoPagoLink,omitempty"`
	IsBlocked       bool   `json:"isBlocked"`
	Email           string `json:"email"`
	CreatedAt       string `json:"createdAt"`
}

type AccountResponse struct {
	ID       string `json:"id"`
	Balance  string `json:"balance"`
	ClientID string `json:"clientId"`
}

type MovementResponse struct {
	ID           string `json:"id"`
	Type         string `json:"type"`
	Amount       string `json:"amount"`
	BalanceAfter string `json:"balanceAfter"`
	Description  string `json:"description"`
	Reference    string `json:"reference,omitempty"`
	CreatedAt    string `json:"createdAt"`
}

type CreditLineResponse struct {
	ID                  string  `json:"id"`
	ClientID            string  `json:"clientId"`
	ClientName          string  `json:"clientName,omitempty"`
	MaxAmount           string  `json:"maxAmount"`
	UsedAmount          string  `json:"usedAmount"`
	AvailableAmount     string  `json:"availableAmount"`
	InterestRate        string  `json:"interestRate"`
	MaxInstallments     int     `json:"maxInstallments"`
	RecalculateOnPrepay bool    `json:"recalculateOnPrepay"`
	Status              string  `json:"status"`
	ApprovedAt          *string `json:"approvedAt,omitempty"`
	RejectionReason     string  `json:"rejectionReason,omitempty"`
	CreatedAt           string  `json:"createdAt"`
}

type CancellationSettlementResponse struct {
	PendingCapital      string `json:"pendingCapital"`
	AccumulatedInterest string `json:"accumulatedInterest"`
	AccumulatedIVA      string `json:"accumulatedIVA"`
	Total               string `json:"total"`
}

type LoanResponse struct {
	ID                     string                           `json:"id"`
	ClientID               string                           `json:"clientId"`
	ClientName             string                           `json:"clientName,omitempty"`
	CreditLineID           string                           `json:"creditLineId"`
	Principal              string                           `json:"principal"`
	InterestRate           string                           `json:"interestRate"`
	NumInstallments        int                              `json:"numInstallments"`
	AmortizationType       string                           `json:"amortizationType"`
	Status                 string                           `json:"status"`
	DisbursedAt            *string                          `json:"disbursedAt,omitempty"`
	TotalPaid              string                           `json:"totalPaid"`
	TotalRemaining         string                           `json:"totalRemaining"`
	CancellationSettlement *CancellationSettlementResponse  `json:"cancellationSettlement,omitempty"`
	Installments           []InstallmentResponse            `json:"installments,omitempty"`
	CreatedAt              string                           `json:"createdAt"`
}

type InstallmentResponse struct {
	ID              string  `json:"id"`
	Number          int     `json:"number"`
	DueDate         string  `json:"dueDate"`
	CapitalAmount   string  `json:"capitalAmount"`
	InterestAmount  string  `json:"interestAmount"`
	IVAAmount       string  `json:"ivaAmount"`
	TotalAmount     string  `json:"totalAmount"`
	PaidAmount      string  `json:"paidAmount"`
	RemainingAmount string  `json:"remainingAmount"`
	PenaltyApplied  bool    `json:"penaltyApplied"`
	Status          string  `json:"status"`
	PaidAt          *string `json:"paidAt,omitempty"`
}

type SimulationResponse struct {
	Principal     string                `json:"principal"`
	InterestRate  string                `json:"interestRate"`
	TotalInterest string                `json:"totalInterest"`
	TotalPayment  string                `json:"totalPayment"`
	Installments  []InstallmentResponse `json:"installments"`
}

type PaymentResponse struct {
	ID             string  `json:"id"`
	LoanID         string  `json:"loanId"`
	InstallmentID  *string `json:"installmentId,omitempty"`
	Amount         string  `json:"amount"`
	Method         string  `json:"method"`
	Reference      string  `json:"reference,omitempty"`
	IsAdjustment   bool    `json:"isAdjustment"`
	AdjustmentNote string  `json:"adjustmentNote,omitempty"`
	CreatedAt      string  `json:"createdAt"`
}

type AuditLogResponse struct {
	ID          string  `json:"id"`
	UserID      *string `json:"userId,omitempty"`
	Action      string  `json:"action"`
	EntityType  string  `json:"entityType"`
	EntityID    string  `json:"entityId"`
	Description string  `json:"description"`
	IP          string  `json:"ip"`
	UserAgent   string  `json:"userAgent"`
	CreatedAt   string  `json:"createdAt"`
}

type PortfolioResponse struct {
	TotalClients     int64  `json:"totalClients"`
	ActiveLoans      int64  `json:"activeLoans"`
	TotalDisbursed   string `json:"totalDisbursed"`
	TotalOutstanding string `json:"totalOutstanding"`
	TotalCollected   string `json:"totalCollected"`
	PendingApprovals int64  `json:"pendingApprovals"`
}

type DelinquencyResponse struct {
	PAR30           string `json:"par30"`
	PAR60           string `json:"par60"`
	PAR90           string `json:"par90"`
	TotalOverdue    string `json:"totalOverdue"`
	OverdueCount    int64  `json:"overdueCount"`
	DelinquencyRate string `json:"delinquencyRate"`
}

type KPIResponse struct {
	Portfolio   PortfolioResponse   `json:"portfolio"`
	Delinquency DelinquencyResponse `json:"delinquency"`
}

type TrendPointResponse struct {
	Date   time.Time `json:"date"`
	Amount string    `json:"amount"`
	Count  int64     `json:"count"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Offset     int         `json:"offset"`
	Limit      int         `json:"limit"`
}

// OverdueInstallmentResponse is a collections worklist row.
type OverdueInstallmentResponse struct {
	InstallmentID   string `json:"installmentId"`
	LoanID          string `json:"loanId"`
	ClientID        string `json:"clientId"`
	ClientName      string `json:"clientName"`
	Number          int    `json:"number"`
	DueDate         string `json:"dueDate"`
	DaysOverdue     int    `json:"daysOverdue"`
	TotalAmount     string `json:"totalAmount"`
	RemainingAmount string `json:"remainingAmount"`
	Status          string `json:"status"`
}

type VendorResponse struct {
	ID           string `json:"id"`
	BusinessName string `json:"businessName"`
	CUIT         string `json:"cuit"`
	Phone        string `json:"phone"`
	Address      string `json:"address"`
	City         string `json:"city"`
	Province     string `json:"province"`
	Country      string `json:"country"`
	IsActive     bool   `json:"isActive"`
	Email        string `json:"email"`
	CreatedAt    string `json:"createdAt"`
}

type VendorAccountResponse struct {
	ID       string `json:"id"`
	VendorID string `json:"vendorId"`
	Balance  string `json:"balance"`
}

type VendorMovementResponse struct {
	ID           string `json:"id"`
	Type         string `json:"type"`
	Amount       string `json:"amount"`
	BalanceAfter string `json:"balanceAfter"`
	Description  string `json:"description"`
	Reference    string `json:"reference,omitempty"`
	CreatedAt    string `json:"createdAt"`
}

type PurchaseResponse struct {
	ID           string `json:"id"`
	VendorID     string `json:"vendorId"`
	VendorName   string `json:"vendorName,omitempty"`
	ClientID     string `json:"clientId"`
	ClientName   string `json:"clientName,omitempty"`
	CreditLineID string `json:"creditLineId"`
	LoanID       string `json:"loanId"`
	Amount       string `json:"amount"`
	Description  string `json:"description"`
	CreatedAt    string `json:"createdAt"`
}

type VendorPaymentResponse struct {
	ID        string `json:"id"`
	VendorID  string `json:"vendorId"`
	Amount    string `json:"amount"`
	Method    string `json:"method"`
	Reference string `json:"reference,omitempty"`
	PaidBy    string `json:"paidBy"`
	CreatedAt string `json:"createdAt"`
}

type WithdrawalRequestResponse struct {
	ID              string  `json:"id"`
	VendorID        string  `json:"vendorId"`
	VendorName      string  `json:"vendorName,omitempty"`
	Amount          string  `json:"amount"`
	Method          string  `json:"method"`
	Reference       string  `json:"reference,omitempty"`
	Status          string  `json:"status"`
	RejectionReason string  `json:"rejectionReason,omitempty"`
	RequestedAt     string  `json:"requestedAt"`
	ProcessedAt     *string `json:"processedAt,omitempty"`
	PaymentID       *string `json:"paymentId,omitempty"`
}

type FinancialReportResponse struct {
	InterestAccrued   string `json:"interestAccrued"`
	InterestCollected string `json:"interestCollected"`
	IVAAccrued        string `json:"ivaAccrued"`
	IVACollected      string `json:"ivaCollected"`
	CapitalCollected  string `json:"capitalCollected"`
	CapitalPending    string `json:"capitalPending"`
}

type PortfolioPositionItemResponse struct {
	Status           string `json:"status"`
	LoanCount        int64  `json:"loanCount"`
	TotalPrincipal   string `json:"totalPrincipal"`
	TotalOutstanding string `json:"totalOutstanding"`
}

type PortfolioPositionResponse struct {
	Items []PortfolioPositionItemResponse `json:"items"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}
