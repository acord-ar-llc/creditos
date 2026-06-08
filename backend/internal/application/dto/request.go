package dto

type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	FirstName   string `json:"firstName" binding:"required"`
	LastName    string `json:"lastName" binding:"required"`
	DNI         string `json:"dni" binding:"required"`
	CUIT        string `json:"cuit" binding:"required"`
	DateOfBirth string `json:"dateOfBirth" binding:"required"`
	Phone       string `json:"phone" binding:"required"`
	Address     string `json:"address" binding:"required"`
	City        string `json:"city" binding:"required"`
	Province    string `json:"province" binding:"required"`
	Country     string `json:"country"`
	IsPEP       bool   `json:"isPEP"`
}

type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type UpdateProfileRequest struct {
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	City     string `json:"city"`
	Province string `json:"province"`
	Country  string `json:"country"`
}

type MercadoPagoLinkRequest struct {
	Link string `json:"link" binding:"required"`
}

type CreateCreditLineRequest struct {
	ClientID            string `json:"clientId" binding:"required,uuid"`
	MaxAmount           string `json:"maxAmount" binding:"required"`
	InterestRate        string `json:"interestRate" binding:"required"`
	MaxInstallments     int    `json:"maxInstallments" binding:"required,min=1,max=60"`
	RecalculateOnPrepay bool   `json:"recalculateOnPrepay"`
}

type ApproveCreditLineRequest struct {
	ApprovedBy string `json:"-"`
}

type RejectCreditLineRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type SimulateLoanRequest struct {
	CreditLineID     string `json:"creditLineId" binding:"required,uuid"`
	Amount           string `json:"amount" binding:"required"`
	NumInstallments  int    `json:"numInstallments" binding:"required,min=1"`
	AmortizationType string `json:"amortizationType" binding:"required,oneof=french german"`
}

type RequestLoanRequest struct {
	CreditLineID     string `json:"creditLineId" binding:"required,uuid"`
	Amount           string `json:"amount" binding:"required"`
	NumInstallments  int    `json:"numInstallments" binding:"required,min=1"`
	AmortizationType string `json:"amortizationType" binding:"required,oneof=french german"`
}

type AdminCreateLoanRequest struct {
	ClientID         string `json:"clientId" binding:"required,uuid"`
	CreditLineID     string `json:"creditLineId" binding:"required,uuid"`
	Amount           string `json:"amount" binding:"required"`
	NumInstallments  int    `json:"numInstallments" binding:"required,min=1"`
	AmortizationType string `json:"amortizationType" binding:"required,oneof=french german"`
}

type RecordPaymentRequest struct {
	Amount        string `json:"amount" binding:"required"`
	Method        string `json:"method" binding:"required,oneof=cash transfer mercado_pago"`
	Reference     string `json:"reference"`
	InstallmentID string `json:"installmentId"`
}

type AdjustPaymentRequest struct {
	Note string `json:"note" binding:"required"`
}

type PrepayLoanRequest struct {
	Amount   string `json:"amount" binding:"required"`
	Strategy string `json:"strategy,omitempty"`
}

type UpdateIVARateRequest struct {
	IVARate float64 `json:"ivaRate" binding:"required,min=0,max=100"`
}

type UpdateCommentsRequest struct {
	Comments string `json:"comments"`
}

type AdminUpdateClientRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	DNI       string `json:"dni"`
	CUIT      string `json:"cuit"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	City      string `json:"city"`
	Province  string `json:"province"`
	Country   string `json:"country"`
	IsPEP     bool   `json:"isPEP"`
}

type SearchClientsRequest struct {
	Query  string `form:"q"`
	Offset int    `form:"offset"`
	Limit  int    `form:"limit"`
}

type PaginationRequest struct {
	Offset int `form:"offset"`
	Limit  int `form:"limit"`
}

type RegisterVendorRequest struct {
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=8"`
	BusinessName string `json:"businessName" binding:"required"`
	CUIT         string `json:"cuit" binding:"required"`
	Phone        string `json:"phone" binding:"required"`
	Address      string `json:"address" binding:"required"`
	City         string `json:"city" binding:"required"`
	Province     string `json:"province" binding:"required"`
	Country      string `json:"country"`
}

type UpdateVendorProfileRequest struct {
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	City     string `json:"city"`
	Province string `json:"province"`
	Country  string `json:"country"`
}

type RecordPurchaseRequest struct {
	ClientID         string `json:"clientId" binding:"required,uuid"`
	CreditLineID     string `json:"creditLineId" binding:"required,uuid"`
	Amount           string `json:"amount" binding:"required"`
	Description      string `json:"description" binding:"required"`
	NumInstallments  int    `json:"numInstallments" binding:"required,min=1"`
	AmortizationType string `json:"amortizationType" binding:"required,oneof=french german"`
}

type RecordVendorPaymentRequest struct {
	VendorID  string `json:"vendorId" binding:"required,uuid"`
	Amount    string `json:"amount" binding:"required"`
	Method    string `json:"method" binding:"required,oneof=cash transfer"`
	Reference string `json:"reference"`
}

type RegisterClientByVendorRequest struct {
	Email       string `json:"email" binding:"required,email"`
	FirstName   string `json:"firstName" binding:"required"`
	LastName    string `json:"lastName" binding:"required"`
	DNI         string `json:"dni" binding:"required"`
	CUIT        string `json:"cuit" binding:"required"`
	DateOfBirth string `json:"dateOfBirth" binding:"required"`
	Phone       string `json:"phone" binding:"required"`
	Address     string `json:"address" binding:"required"`
	City        string `json:"city" binding:"required"`
	Province    string `json:"province" binding:"required"`
	Country     string `json:"country"`
	IsPEP       bool   `json:"isPEP"`
}

type UpdateCreditLineRequest struct {
	MaxAmount           string `json:"maxAmount" binding:"required"`
	RecalculateOnPrepay *bool  `json:"recalculateOnPrepay,omitempty"`
}

type RequestCreditLineByVendorRequest struct {
	ClientID        string `json:"clientId" binding:"required,uuid"`
	MaxAmount       string `json:"maxAmount" binding:"required"`
	InterestRate    string `json:"interestRate" binding:"required"`
	MaxInstallments int    `json:"maxInstallments" binding:"required,min=1,max=60"`
}

type CreateWithdrawalRequest struct {
	Amount string `json:"amount" binding:"required"`
	Method string `json:"method" binding:"required,oneof=cash transfer"`
}

type ApproveWithdrawalRequest struct {
	Reference string `json:"reference"`
}

type RejectWithdrawalRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type RequestOTPRequest struct {
	Email   string `json:"email" binding:"omitempty,email"`
	Phone   string `json:"phone" binding:"omitempty"`
	Channel string `json:"channel" binding:"omitempty,oneof=email phone"`
}

type VerifyOTPRequest struct {
	Email   string `json:"email" binding:"omitempty,email"`
	Phone   string `json:"phone" binding:"omitempty"`
	Channel string `json:"channel" binding:"omitempty,oneof=email phone"`
	Code    string `json:"code" binding:"required,len=6"`
}

type FirebaseLoginRequest struct {
	IDToken string `json:"idToken" binding:"required"`
}
