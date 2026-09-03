import apiClient from "./client";
import { getCountryConfig, type CountryConfig } from "../config/countryConfig";
import type {
  RegisterRequest,
  AuthResponse,
  RequestOTPRequest,
  VerifyOTPRequest,
  FirebaseLoginRequest,
  Profile,
  UpdateProfileRequest,
  UpdateMercadoPagoRequest,
  Account,
  Movement,
  Loan,
  LoanDetail,
  LoanRequest,
  SimulateRequest,
  SimulationResult,
  Payment,
  RecordPaymentRequest,
  CancellationSettlement,
  Client,
  CreditLine,
  CreateCreditLineRequest,
  PortfolioSummary,
  DelinquencySummary,
  KPIs,
  TrendData,
  AuditEntry,
  PaginatedResponse,
  Vendor,
  VendorAccount,
  VendorMovement,
  Purchase,
  VendorPayment,
  RegisterVendorRequest,
  UpdateVendorProfileRequest,
  RecordPurchaseRequest,
  RecordVendorPaymentRequest,
  RegisterClientByVendorRequest,
  RequestCreditLineByVendorRequest,
  AdminUpdateClientRequest,
  UpdateCreditLineRequest,
  WithdrawalRequest,
  CreateWithdrawalRequest,
  ApproveWithdrawalRequest,
  RejectWithdrawalRequest,
  FinancialReport,
  PortfolioPositionReport,
  OverdueInstallment,
} from "./types";

// ==================== Auth ====================

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const res = await apiClient.post("/auth/register", data);
  return res.data;
};

export const requestOTP = async (data: RequestOTPRequest): Promise<{ message: string }> => {
  const res = await apiClient.post("/auth/request-otp", data);
  return res.data;
};

export const verifyOTP = async (data: VerifyOTPRequest): Promise<AuthResponse> => {
  const res = await apiClient.post("/auth/verify-otp", data);
  return res.data;
};

export const firebaseLogin = async (data: FirebaseLoginRequest): Promise<AuthResponse> => {
  const res = await apiClient.post("/auth/firebase-login", data);
  return res.data;
};

// ==================== Profile ====================

export const getProfile = async (): Promise<Profile> => {
  const res = await apiClient.get("/me/profile");
  return res.data;
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<Profile> => {
  const res = await apiClient.put("/me/profile", data);
  return res.data;
};

export const updateMercadoPago = async (data: UpdateMercadoPagoRequest): Promise<Profile> => {
  const res = await apiClient.put("/me/mercadopago", data);
  return res.data;
};

// ==================== Account ====================

export const getAccount = async (): Promise<Account> => {
  const res = await apiClient.get("/me/account");
  return res.data;
};

export const getMovements = async (page = 1, pageSize = 20): Promise<PaginatedResponse<Movement>> => {
  const res = await apiClient.get("/me/account/movements", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

// ==================== Loans ====================

export const getLoans = async (): Promise<Loan[]> => {
  const res = await apiClient.get("/me/loans");
  return res.data.data || res.data;
};

export const getLoan = async (id: string): Promise<LoanDetail> => {
  const res = await apiClient.get(`/me/loans/${id}`);
  return res.data;
};

export const requestLoan = async (data: LoanRequest): Promise<Loan> => {
  const res = await apiClient.post("/me/loans", data);
  return res.data;
};

export const simulateLoan = async (data: SimulateRequest): Promise<SimulationResult> => {
  const res = await apiClient.post("/loans/simulate", data);
  return res.data;
};

// ==================== Payments ====================

export const recordPayment = async (loanId: string, data: RecordPaymentRequest): Promise<Payment> => {
  const res = await apiClient.post(`/me/loans/${loanId}/payments`, data);
  return res.data;
};

export const getPayments = async (): Promise<Payment[]> => {
  const res = await apiClient.get("/me/payments");
  return res.data.data || res.data;
};

// ==================== Admin: Clients ====================

export const adminRegisterClient = async (data: RegisterRequest): Promise<Client> => {
  const res = await apiClient.post("/admin/clients", data);
  return res.data;
};

export const adminGetClients = async (page = 1, pageSize = 20): Promise<PaginatedResponse<Client>> => {
  const res = await apiClient.get("/admin/clients", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetClient = async (id: string): Promise<Client> => {
  const res = await apiClient.get(`/admin/clients/${id}`);
  return res.data;
};

export const adminUpdateClient = async (clientId: string, data: AdminUpdateClientRequest): Promise<Client> => {
  const res = await apiClient.put(`/admin/clients/${clientId}`, data);
  return res.data;
};

export const adminSearchClients = async (query: string): Promise<Client[]> => {
  const res = await apiClient.get("/admin/clients/search", { params: { q: query } });
  return res.data.data || res.data;
};

export const adminUpdateIVARate = async (clientId: string, ivaRate: number): Promise<Client> => {
  const res = await apiClient.put(`/admin/clients/${clientId}/iva-rate`, { ivaRate });
  return res.data;
};

export const adminUpdateClientComments = async (clientId: string, comments: string): Promise<Client> => {
  const res = await apiClient.put(`/admin/clients/${clientId}/comments`, { comments });
  return res.data;
};

export const adminGetClientLoans = async (clientId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Loan>> => {
  const res = await apiClient.get(`/admin/clients/${clientId}/loans`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetClientCreditLines = async (clientId: string): Promise<CreditLine[]> => {
  const res = await apiClient.get(`/admin/clients/${clientId}/credit-lines`);
  return res.data;
};

export const adminGetClientPayments = async (clientId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Payment>> => {
  const res = await apiClient.get(`/admin/clients/${clientId}/payments`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetClientPurchases = async (clientId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Purchase>> => {
  const res = await apiClient.get(`/admin/clients/${clientId}/purchases`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetClientAccount = async (clientId: string): Promise<Account> => {
  const res = await apiClient.get(`/admin/clients/${clientId}/account`);
  return res.data;
};

export const adminGetClientMovements = async (clientId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Movement>> => {
  const res = await apiClient.get(`/admin/clients/${clientId}/account/movements`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminUpdateCreditLine = async (creditLineId: string, data: UpdateCreditLineRequest): Promise<CreditLine> => {
  const res = await apiClient.put(`/admin/credit-lines/${creditLineId}`, data);
  return res.data;
};

// ==================== Admin: Credit Lines ====================

export const adminCreateCreditLine = async (data: CreateCreditLineRequest): Promise<CreditLine> => {
  const res = await apiClient.post("/admin/credit-lines", data);
  return res.data;
};

export const adminApproveCreditLine = async (id: string): Promise<CreditLine> => {
  const res = await apiClient.post(`/admin/credit-lines/${id}/approve`);
  return res.data;
};

export const adminRejectCreditLine = async (id: string, reason: string): Promise<CreditLine> => {
  const res = await apiClient.post(`/admin/credit-lines/${id}/reject`, { reason });
  return res.data;
};

// ==================== Admin: Loans ====================

export const adminCreateLoan = async (data: { clientId: string; creditLineId: string; amount: string; numInstallments: number; amortizationType: string }): Promise<Loan> => {
  const res = await apiClient.post("/admin/loans", data);
  return res.data;
};

export const adminCreateWithdrawal = async (data: { clientId: string; creditLineId: string; amount: string; numInstallments: number; amortizationType: string }): Promise<Loan> => {
  const res = await apiClient.post("/admin/loans/withdrawal", data);
  return res.data;
};

export const adminGetPendingLoans = async (): Promise<Loan[]> => {
  const res = await apiClient.get("/admin/loans/pending");
  return res.data.data || res.data;
};

export const adminApproveLoan = async (id: string): Promise<Loan> => {
  const res = await apiClient.post(`/admin/loans/${id}/approve`);
  return res.data;
};

export const adminDisburseLoan = async (id: string): Promise<Loan> => {
  const res = await apiClient.post(`/admin/loans/${id}/disburse`);
  return res.data;
};

export const adminCancelLoan = async (id: string): Promise<{ loan: Loan; paymentId: string }> => {
  const res = await apiClient.post(`/admin/loans/${id}/cancel`);
  return res.data;
};

export const adminPrepayLoan = async (id: string, amount: string, strategy: string = "reduce_installment"): Promise<Loan> => {
  const res = await apiClient.post(`/admin/loans/${id}/prepay`, { amount, strategy });
  return res.data;
};

export const adminRecordLoanPayment = async (loanId: string, data: RecordPaymentRequest): Promise<Payment> => {
  const res = await apiClient.post(`/admin/loans/${loanId}/payments`, data);
  return res.data;
};

// ==================== Admin: Loan Receipts & Simulation ====================

export const adminDownloadPaymentReceipt = async (loanId: string, paymentId: string): Promise<Blob> => {
  const res = await apiClient.get(`/admin/loans/${loanId}/payments/${paymentId}/receipt`, { responseType: "blob" });
  return res.data;
};

export const adminDownloadLoanSchedule = async (loanId: string): Promise<Blob> => {
  const res = await apiClient.get(`/admin/loans/${loanId}/schedule-pdf`, { responseType: "blob" });
  return res.data;
};

export const adminSimulateCancellation = async (loanId: string): Promise<CancellationSettlement> => {
  const res = await apiClient.get(`/admin/loans/${loanId}/simulate-cancellation`);
  return res.data;
};

// ==================== Admin: Dashboard ====================

export const getDashboard = async (): Promise<PortfolioSummary> => {
  const res = await apiClient.get("/admin/dashboard/portfolio");
  return res.data;
};

export const getDelinquency = async (): Promise<DelinquencySummary> => {
  const res = await apiClient.get("/admin/dashboard/delinquency");
  const d = res.data;
  return {
    delinquencyRate: parseFloat(d.delinquencyRate) || 0,
    overdueCount: d.overdueCount || 0,
    totalOverdue: parseFloat(d.totalOverdue) || 0,
    par30: parseFloat(d.par30) || 0,
    par60: parseFloat(d.par60) || 0,
    par90: parseFloat(d.par90) || 0,
  };
};

export const getKPIs = async (): Promise<KPIs> => {
  const res = await apiClient.get("/admin/dashboard/kpis");
  const { portfolio, delinquency } = res.data;
  const totalDisbursed = parseFloat(portfolio.totalDisbursed) || 0;
  const totalCollected = parseFloat(portfolio.totalCollected) || 0;
  const activeLoans = portfolio.activeLoans || 0;
  return {
    totalClients: portfolio.totalClients || 0,
    activeLoans,
    totalDisbursed,
    delinquencyRate: parseFloat(delinquency.delinquencyRate) || 0,
    collectionRate: totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0,
    averageLoanAmount: activeLoans > 0 ? totalDisbursed / activeLoans : 0,
  };
};

export const getDisbursementTrends = async (): Promise<TrendData[]> => {
  const res = await apiClient.get("/admin/dashboard/trends/disbursements");
  return (res.data || []).map((d: { date: string; amount: string; count: number }) => ({
    month: new Date(d.date).toLocaleDateString(getCountryConfig().locale, { month: "short", year: "2-digit" }),
    amount: parseFloat(d.amount) || 0,
    count: d.count,
  }));
};

export const getCollectionTrends = async (): Promise<TrendData[]> => {
  const res = await apiClient.get("/admin/dashboard/trends/collections");
  return (res.data || []).map((d: { date: string; amount: string; count: number }) => ({
    month: new Date(d.date).toLocaleDateString(getCountryConfig().locale, { month: "short", year: "2-digit" }),
    amount: parseFloat(d.amount) || 0,
    count: d.count,
  }));
};

// ==================== Vendor: Self-Service ====================

export const getVendorProfile = async (): Promise<Vendor> => {
  const res = await apiClient.get("/me/vendor/profile");
  return res.data;
};

export const updateVendorProfile = async (data: UpdateVendorProfileRequest): Promise<Vendor> => {
  const res = await apiClient.put("/me/vendor/profile", data);
  return res.data;
};

export const getVendorAccount = async (): Promise<VendorAccount> => {
  const res = await apiClient.get("/me/vendor/account");
  return res.data;
};

export const getVendorMovements = async (page = 1, pageSize = 20): Promise<PaginatedResponse<VendorMovement>> => {
  const res = await apiClient.get("/me/vendor/account/movements", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const getVendorPurchases = async (page = 1, pageSize = 20): Promise<PaginatedResponse<Purchase>> => {
  const res = await apiClient.get("/me/vendor/purchases", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const vendorSearchClients = async (query: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Client>> => {
  const res = await apiClient.get("/me/vendor/clients/search", { params: { q: query, offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const vendorGetClientCreditLines = async (clientId: string): Promise<CreditLine[]> => {
  const res = await apiClient.get(`/me/vendor/clients/${clientId}/credit-lines`);
  return res.data;
};

export const vendorRegisterClient = async (data: RegisterClientByVendorRequest): Promise<Client> => {
  const res = await apiClient.post("/me/vendor/clients/register", data);
  return res.data;
};

export const vendorRequestCreditLine = async (clientId: string, data: RequestCreditLineByVendorRequest): Promise<CreditLine> => {
  const res = await apiClient.post(`/me/vendor/clients/${clientId}/credit-lines`, data);
  return res.data;
};

export const vendorRecordPurchase = async (data: RecordPurchaseRequest): Promise<Purchase> => {
  const res = await apiClient.post("/me/vendor/purchases", data);
  return res.data;
};

export const vendorRequestWithdrawal = async (data: CreateWithdrawalRequest): Promise<WithdrawalRequest> => {
  const res = await apiClient.post("/me/vendor/withdrawals", data);
  return res.data;
};

export const vendorGetWithdrawals = async (page = 1, pageSize = 20): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const res = await apiClient.get("/me/vendor/withdrawals", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const downloadVendorPaymentReceipt = async (paymentId: string): Promise<Blob> => {
  const res = await apiClient.get(`/me/vendor/payments/${paymentId}/receipt`, { responseType: "blob" });
  return res.data;
};

// ==================== Admin: Vendors ====================

export const adminGetVendors = async (page = 1, pageSize = 20, query = ""): Promise<PaginatedResponse<Vendor>> => {
  const res = await apiClient.get("/admin/vendors", { params: { q: query, offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetVendor = async (id: string): Promise<Vendor> => {
  const res = await apiClient.get(`/admin/vendors/${id}`);
  return res.data;
};

export const adminRegisterVendor = async (data: RegisterVendorRequest): Promise<Vendor> => {
  const res = await apiClient.post("/admin/vendors", data);
  return res.data;
};

export const adminActivateVendor = async (id: string): Promise<void> => {
  await apiClient.post(`/admin/vendors/${id}/activate`);
};

export const adminDeactivateVendor = async (id: string): Promise<void> => {
  await apiClient.post(`/admin/vendors/${id}/deactivate`);
};

export const adminGetVendorPurchases = async (id: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Purchase>> => {
  const res = await apiClient.get(`/admin/vendors/${id}/purchases`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetVendorPayments = async (id: string, page = 1, pageSize = 20): Promise<PaginatedResponse<VendorPayment>> => {
  const res = await apiClient.get(`/admin/vendors/${id}/payments`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminRecordVendorPayment = async (id: string, data: RecordVendorPaymentRequest): Promise<VendorPayment> => {
  const res = await apiClient.post(`/admin/vendors/${id}/payments`, data);
  return res.data;
};

export const adminRecordVendorPurchase = async (vendorId: string, data: RecordPurchaseRequest): Promise<Purchase> => {
  const res = await apiClient.post(`/admin/vendors/${vendorId}/purchases`, data);
  return res.data;
};

export const adminGetVendorWithdrawals = async (vendorId: string, page = 1, pageSize = 20): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const res = await apiClient.get(`/admin/vendors/${vendorId}/withdrawals`, { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminGetPendingWithdrawals = async (page = 1, pageSize = 20): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const res = await apiClient.get("/admin/withdrawals/pending", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

export const adminApproveWithdrawal = async (id: string, data: ApproveWithdrawalRequest): Promise<WithdrawalRequest> => {
  const res = await apiClient.post(`/admin/withdrawals/${id}/approve`, data);
  return res.data;
};

export const adminRejectWithdrawal = async (id: string, data: RejectWithdrawalRequest): Promise<WithdrawalRequest> => {
  const res = await apiClient.post(`/admin/withdrawals/${id}/reject`, data);
  return res.data;
};

export const downloadAdminVendorPaymentReceipt = async (vendorId: string, paymentId: string): Promise<Blob> => {
  const res = await apiClient.get(`/admin/vendors/${vendorId}/payments/${paymentId}/receipt`, { responseType: "blob" });
  return res.data;
};

// ==================== Admin: Reports ====================

export const getFinancialReport = async (from?: string, to?: string): Promise<FinancialReport> => {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get("/admin/reports/financial", { params });
  return res.data;
};

export const getPortfolioPosition = async (from?: string, to?: string): Promise<PortfolioPositionReport> => {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get("/admin/reports/portfolio", { params });
  return res.data;
};

// ==================== Admin: Audit ====================

export const getAuditLogs = async (page = 1, pageSize = 20): Promise<PaginatedResponse<AuditEntry>> => {
  const res = await apiClient.get("/admin/audit", { params: { offset: (page - 1) * pageSize, limit: pageSize } });
  return res.data;
};

// ==================== Deployment config (public) ====================

export const getDeploymentConfig = async (): Promise<CountryConfig> => {
  const res = await apiClient.get("/config");
  return res.data;
};

// ==================== Admin: Client block/unblock ====================

export const adminBlockClient = async (clientId: string): Promise<void> => {
  await apiClient.post(`/admin/clients/${clientId}/block`);
};

export const adminUnblockClient = async (clientId: string): Promise<void> => {
  await apiClient.post(`/admin/clients/${clientId}/unblock`);
};

// ==================== Admin: Collections ====================

export const adminGetOverdueInstallments = async (
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<OverdueInstallment>> => {
  const res = await apiClient.get("/admin/collections/overdue", {
    params: { offset: (page - 1) * pageSize, limit: pageSize },
  });
  return res.data;
};
