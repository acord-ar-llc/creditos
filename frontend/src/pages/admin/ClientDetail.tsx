import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  AccountBalance as BalanceIcon,
  CreditCard as LoanIcon,
  Payment as PaymentIcon,
  ShoppingCart as PurchaseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AccountBalanceWallet as WithdrawalIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Download as DownloadIcon,
  CalculateOutlined as SimulateIcon,
  Block as BlockIcon,
  LockOpen as UnblockIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import {
  adminGetClient,
  adminGetClientLoans,
  adminGetClientCreditLines,
  adminGetClientPayments,
  adminGetClientPurchases,
  adminGetClientAccount,
  adminGetClientMovements,
  adminUpdateCreditLine,
  adminCreateCreditLine,
  adminCreateLoan,
  adminCreateWithdrawal,
  adminRecordLoanPayment,
  adminPrepayLoan,
  adminUpdateIVARate,
  adminUpdateClientComments,
  adminUpdateClient,
  adminApproveCreditLine,
  adminRejectCreditLine,
  adminDownloadPaymentReceipt,
  adminDownloadLoanSchedule,
  adminSimulateCancellation,
  adminCancelLoan,
  adminBlockClient,
  adminUnblockClient,
} from "../../api/endpoints";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import DataTable, { Column } from "../../components/DataTable";
import MoneyDisplay from "../../components/MoneyDisplay";
import StatusBadge from "../../components/StatusBadge";
import KPICard from "../../components/KPICard";
import { formatMoney as fmtMoney, getCountryConfig } from "../../config/countryConfig";
import type { Loan, Payment, Purchase, Movement, CreditLine, Installment, CancellationSettlement } from "../../api/types";

const ClientDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [loansPage, setLoansPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCreditLine, setEditingCreditLine] = useState<CreditLine | null>(null);
  const [newMaxAmount, setNewMaxAmount] = useState("");
  // Create loan dialog state
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [loanDialogMode, setLoanDialogMode] = useState<"loan" | "withdrawal">("loan");
  const [loanCreditLine, setLoanCreditLine] = useState<CreditLine | null>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInstallments, setLoanInstallments] = useState(12);
  const [loanAmortType, setLoanAmortType] = useState<"french" | "german">("french");
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  // Loan detail dialog state
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  // Prepay dialog state
  const [prepayDialogOpen, setPrepayDialogOpen] = useState(false);
  const [prepayLoan, setPrepayLoan] = useState<Loan | null>(null);
  const [prepayAmount, setPrepayAmount] = useState("");
  const [prepayStrategy, setPrepayStrategy] = useState<"reduce_installment" | "reduce_term">("reduce_installment");
  // Create credit line dialog state
  const [createCLOpen, setCreateCLOpen] = useState(false);
  const [clMaxAmount, setClMaxAmount] = useState("100000");
  const [clInterestRate, setClInterestRate] = useState("5");
  const [clMaxInstallments, setClMaxInstallments] = useState("12");
  // Reject credit line dialog
  const [rejectCLOpen, setRejectCLOpen] = useState(false);
  const [rejectCLId, setRejectCLId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  // IVA rate editing
  const [editingIVA, setEditingIVA] = useState(false);
  const [ivaRateValue, setIvaRateValue] = useState("");
  // Comments editing
  const [editingComments, setEditingComments] = useState(false);
  const [commentsValue, setCommentsValue] = useState("");
  // Edit client dialog
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [editClientData, setEditClientData] = useState({
    firstName: "", lastName: "", dni: "", cuit: "", phone: "",
    address: "", city: "", province: "", country: "", isPEP: false,
  });
  // Cancellation simulation dialog
  const [simulateLoan, setSimulateLoan] = useState<Loan | null>(null);
  const [simulationData, setSimulationData] = useState<CancellationSettlement | null>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  // Last recorded payment for receipt download
  const [lastPayment, setLastPayment] = useState<{ paymentId: string; loanId: string } | null>(null);
  const { showSuccess, showError } = useNotification();

  const { data: client, isLoading } = useQuery({
    queryKey: ["admin-client", id],
    queryFn: () => adminGetClient(id!),
    enabled: !!id,
  });

  const { data: account } = useQuery({
    queryKey: ["admin-client-account", id],
    queryFn: () => adminGetClientAccount(id!),
    enabled: !!id,
  });

  const { data: creditLines } = useQuery({
    queryKey: ["admin-client-credit-lines", id],
    queryFn: () => adminGetClientCreditLines(id!),
    enabled: !!id,
  });

  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ["admin-client-loans", id, loansPage],
    queryFn: () => adminGetClientLoans(id!, loansPage),
    enabled: !!id && activeTab === 0,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-client-payments", id, paymentsPage],
    queryFn: () => adminGetClientPayments(id!, paymentsPage),
    enabled: !!id && activeTab === 1,
  });

  const { data: purchasesData, isLoading: purchasesLoading } = useQuery({
    queryKey: ["admin-client-purchases", id, purchasesPage],
    queryFn: () => adminGetClientPurchases(id!, purchasesPage),
    enabled: !!id && activeTab === 2,
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ["admin-client-movements", id, movementsPage],
    queryFn: () => adminGetClientMovements(id!, movementsPage),
    enabled: !!id && activeTab === 3,
  });

  const updateCreditLineMutation = useMutation({
    mutationFn: ({ creditLineId, maxAmount }: { creditLineId: string; maxAmount: string }) =>
      adminUpdateCreditLine(creditLineId, { maxAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      setEditDialogOpen(false);
      setEditingCreditLine(null);
      setNewMaxAmount("");
      showSuccess(t("admin.creditLineUpdated"));
    },
    onError: (err: unknown) => {
      showError(getErrorMessage(err, t("admin.creditLineUpdateError")));
    },
  });

  const updateIVARateMutation = useMutation({
    mutationFn: ({ clientId, ivaRate }: { clientId: string; ivaRate: number }) =>
      adminUpdateIVARate(clientId, ivaRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client", id] });
      setEditingIVA(false);
      showSuccess(t("admin.ivaRateUpdated"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("admin.ivaRateUpdateError"))),
  });

  const updateCommentsMutation = useMutation({
    mutationFn: ({ clientId, comments }: { clientId: string; comments: string }) =>
      adminUpdateClientComments(clientId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client", id] });
      setEditingComments(false);
      showSuccess(t("admin.commentsUpdated"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("admin.commentsUpdateError"))),
  });

  const blockMutation = useMutation({
    mutationFn: (block: boolean) =>
      block ? adminBlockClient(id!) : adminUnblockClient(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client", id] });
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("common.error"))),
  });

  const handleToggleBlock = () => {
    if (!client) return;
    const block = !client.isBlocked;
    const msg = block ? t("confirm.blockClient") : t("confirm.unblockClient");
    if (!window.confirm(msg)) return;
    blockMutation.mutate(block, {
      onSuccess: () =>
        showSuccess(block ? t("admin.blockClient") : t("admin.unblockClient")),
    });
  };

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: typeof editClientData }) =>
      adminUpdateClient(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client", id] });
      setEditClientOpen(false);
      showSuccess(t("admin.clientUpdated"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("admin.clientUpdateError"))),
  });

  const handleOpenEditClient = () => {
    if (!client) return;
    setEditClientData({
      firstName: client.firstName, lastName: client.lastName,
      dni: client.dni, cuit: client.cuit, phone: client.phone,
      address: client.address, city: client.city, province: client.province,
      country: client.country || "Argentina", isPEP: client.isPEP,
    });
    setEditClientOpen(true);
  };

  const handleOpenLoanDialog = (cl: CreditLine, mode: "loan" | "withdrawal") => {
    setLoanCreditLine(cl);
    setLoanDialogMode(mode);
    setLoanAmount("");
    setLoanInstallments(12);
    setLoanAmortType("french");
    setLoanDialogOpen(true);
  };

  const handleCloseLoanDialog = () => {
    setLoanDialogOpen(false);
    setLoanCreditLine(null);
  };

  const createLoanMutation = useMutation({
    mutationFn: adminCreateLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-loans", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      handleCloseLoanDialog();
      showSuccess(t("admin.loanCreated"));
    },
    onError: (err: unknown) => {
      showError(getErrorMessage(err, t("admin.loanCreateError")));
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: adminCreateWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-loans", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-account", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-movements", id] });
      handleCloseLoanDialog();
      showSuccess(t("admin.withdrawalCreated"));
    },
    onError: (err: unknown) => {
      showError(getErrorMessage(err, t("admin.withdrawalCreateError")));
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ loanId, installment, method }: { loanId: string; installment: Installment; method: string }) =>
      adminRecordLoanPayment(loanId, { amount: installment.remainingAmount, method, installmentId: installment.id }),
    onSuccess: (payment: Payment) => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-loans", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-payments", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-account", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-movements", id] });
      const loanId = paymentLoan?.id || "";
      setPaymentDialogOpen(false);
      setPaymentLoan(null);
      setPaymentMethod("cash");
      setPaymentReference("");
      setLastPayment({ paymentId: payment.id, loanId });
      showSuccess(t("admin.paymentRecorded"));
    },
    onError: (err: unknown) => {
      showError(getErrorMessage(err, t("admin.paymentRecordError")));
    },
  });

  const prepayMutation = useMutation({
    mutationFn: ({ loanId, amount, strategy }: { loanId: string; amount: string; strategy: string }) =>
      adminPrepayLoan(loanId, amount, strategy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-loans", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-payments", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-account", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-movements", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      setPrepayDialogOpen(false);
      setPrepayLoan(null);
      setPrepayAmount("");
      setPrepayStrategy("reduce_installment");
      showSuccess(t("admin.prepayRecorded"));
    },
    onError: (err: unknown) => {
      showError(getErrorMessage(err, t("admin.prepayError")));
    },
  });

  const createCreditLineMutation = useMutation({
    mutationFn: adminCreateCreditLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      setCreateCLOpen(false);
      setClMaxAmount("100000");
      setClInterestRate("5");
      setClMaxInstallments("12");
      showSuccess(t("creditLines.created"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("creditLines.createError"))),
  });

  const approveCreditLineMutation = useMutation({
    mutationFn: (creditLineId: string) => adminApproveCreditLine(creditLineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      showSuccess(t("creditLines.approved"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("creditLines.approveError"))),
  });

  const rejectCreditLineMutation = useMutation({
    mutationFn: ({ creditLineId, reason }: { creditLineId: string; reason: string }) =>
      adminRejectCreditLine(creditLineId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-credit-lines", id] });
      setRejectCLOpen(false);
      setRejectCLId(null);
      setRejectReason("");
      showSuccess(t("creditLines.rejected"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("creditLines.rejectError"))),
  });

  const cancelLoanMutation = useMutation({
    mutationFn: (loanId: string) => adminCancelLoan(loanId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-loans", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-account", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-movements", id] });
      const loanId = simulateLoan?.id || "";
      setSimulateLoan(null);
      setSimulationData(null);
      showSuccess(t("admin.loanCancelled"));
      setLastPayment({ loanId, paymentId: data.paymentId });
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("admin.cancelError"))),
  });

  const handleDownloadReceipt = async (loanId: string, paymentId: string) => {
    try {
      const blob = await adminDownloadPaymentReceipt(loanId, paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${paymentId.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showError(t("admin.receiptDownloadError"));
    }
  };

  const handleSimulateCancellation = async (loan: Loan) => {
    setSimulateLoan(loan);
    setSimulationLoading(true);
    setSimulationData(null);
    try {
      const data = await adminSimulateCancellation(loan.id);
      setSimulationData(data);
    } catch {
      showError(t("admin.simulationError"));
      setSimulateLoan(null);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleSubmitLoan = () => {
    if (!loanCreditLine || !loanAmount || !id) return;
    const data = {
      clientId: id,
      creditLineId: loanCreditLine.id,
      amount: loanAmount,
      numInstallments: loanInstallments,
      amortizationType: loanAmortType,
    };
    if (loanDialogMode === "withdrawal") {
      createWithdrawalMutation.mutate(data);
    } else {
      createLoanMutation.mutate(data);
    }
  };

  const formatMoney = (amount: number) =>
    fmtMoney(amount, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

  // Chart data: aggregate payments by month
  const chartData = useMemo(() => {
    if (!paymentsData?.data) return [];
    const byMonth: Record<string, number> = {};
    paymentsData.data.forEach((p) => {
      const month = new Date(p.createdAt).toLocaleDateString(getCountryConfig().locale, { month: "short", year: "2-digit" });
      byMonth[month] = (byMonth[month] || 0) + parseFloat(p.amount);
    });
    return Object.entries(byMonth).map(([month, amount]) => ({ month, pagos: amount }));
  }, [paymentsData]);

  // KPI computations
  const activeLoansCount = loansData?.data?.filter((l) => l.status === "active" || l.status === "disbursed").length || 0;
  const totalPaid = paymentsData?.data?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const totalPurchasesCount = purchasesData?.total || 0;

  const loanColumns: Column<Loan>[] = [
    { id: "id", label: "ID", minWidth: 90, render: (row) => (
      <Button size="small" variant="text" sx={{ textTransform: "none", minWidth: 0, p: 0 }} onClick={() => { setDetailLoan(row); setDetailDialogOpen(true); }}>
        #{row.id.slice(0, 8)}
      </Button>
    ) },
    { id: "principal", label: t("loans.principal"), align: "right", render: (row) => <MoneyDisplay amount={row.principal} fontWeight={500} /> },
    { id: "interestRate", label: t("admin.rate"), align: "center", render: (row) => `${row.interestRate}%` },
    { id: "numInstallments", label: t("loans.installments"), align: "center" },
    { id: "amortizationType", label: t("loans.system"), render: (row) => <Chip label={row.amortizationType === "french" ? t("loans.french") : t("loans.german")} size="small" variant="outlined" /> },
    { id: "status", label: t("common.status"), render: (row) => <StatusBadge status={row.status} /> },
    { id: "createdAt", label: t("common.date"), render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy") },
    { id: "actions" as keyof Loan, label: t("common.actions"), minWidth: 340, render: (row) =>
      (row.status === "active") ? (
        <Box display="flex" gap={0.5} flexWrap="wrap">
          <Button size="small" variant="outlined" onClick={() => { setPaymentLoan(row); setPaymentDialogOpen(true); }}>
            {t("admin.payInstallment")}
          </Button>
          <Button size="small" variant="outlined" color="warning" onClick={() => { setPrepayLoan(row); setPrepayDialogOpen(true); }}>
            {t("admin.capitalPrepay")}
          </Button>
          <Button size="small" variant="outlined" color="info" startIcon={<SimulateIcon />} onClick={() => handleSimulateCancellation(row)}>
            {t("admin.simulateCancellation")}
          </Button>
        </Box>
      ) : null
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    { id: "createdAt", label: t("common.date"), minWidth: 120, render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy HH:mm") },
    { id: "amount", label: t("common.amount"), align: "right", render: (row) => <MoneyDisplay amount={row.amount} fontWeight={500} /> },
    { id: "method", label: t("payments.method"), render: (row) => <Chip label={row.method} size="small" variant="outlined" /> },
    { id: "loanId", label: t("payments.loan"), render: (row) => `#${row.loanId.slice(0, 8)}` },
    { id: "isAdjustment", label: t("common.status"), render: (row) => row.isAdjustment ? <Chip label={t("payments.adjustment")} size="small" color="warning" /> : <Chip label="OK" size="small" color="success" /> },
  ];

  const purchaseColumns: Column<Purchase>[] = [
    { id: "createdAt", label: t("common.date"), minWidth: 120, render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy") },
    { id: "vendorName", label: t("nav.vendors"), render: (row) => row.vendorName || row.vendorId.slice(0, 8) },
    { id: "amount", label: t("common.amount"), align: "right", render: (row) => <MoneyDisplay amount={row.amount} fontWeight={500} /> },
    { id: "description", label: t("common.description") },
  ];

  const movementColumns: Column<Movement>[] = [
    { id: "createdAt", label: t("common.date"), minWidth: 120, render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy HH:mm") },
    { id: "type", label: t("common.type"), render: (row) => <Chip label={row.type === "debit" ? t("account.credit") : t("account.debit")} size="small" color={row.type === "debit" ? "success" : "error"} /> },
    { id: "amount", label: t("common.amount"), align: "right", render: (row) => <MoneyDisplay amount={row.amount} fontWeight={500} color={row.type === "debit" ? "success.main" : "error.main"} /> },
    { id: "balanceAfter", label: t("account.balance"), align: "right", render: (row) => <MoneyDisplay amount={row.balanceAfter} /> },
    { id: "description", label: t("common.description") },
  ];

  const handleEditCreditLine = (cl: CreditLine) => {
    setEditingCreditLine(cl);
    setNewMaxAmount(cl.maxAmount);
    setEditDialogOpen(true);
  };

  const handleSaveCreditLine = () => {
    if (!editingCreditLine) return;
    updateCreditLineMutation.mutate({ creditLineId: editingCreditLine.id, maxAmount: newMaxAmount });
  };

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  }

  if (!client) {
    return <Alert severity="error">{t("admin.clientNotFound")}</Alert>;
  }

  const activeCreditLine = creditLines?.find((cl) => cl.status === "approved");

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate("/admin/clients")} sx={{ mb: 2 }}>
        {t("admin.backToClients")}
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {client.firstName} {client.lastName}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <StatusBadge status={client.isBlocked ? "blocked" : "active"} size="medium" />
          <Button
            variant="outlined"
            color={client.isBlocked ? "success" : "error"}
            startIcon={client.isBlocked ? <UnblockIcon /> : <BlockIcon />}
            onClick={handleToggleBlock}
            disabled={blockMutation.isPending}
          >
            {client.isBlocked ? t("admin.unblockClient") : t("admin.blockClient")}
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={<BalanceIcon sx={{ fontSize: 28 }} />}
            label={t("admin.clientDetailBalance")}
            value={account ? formatMoney(parseFloat(account.balance)) : "$0"}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={<LoanIcon sx={{ fontSize: 28 }} />}
            label={t("admin.clientDetailActiveLoans")}
            value={activeLoansCount}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={<PaymentIcon sx={{ fontSize: 28 }} />}
            label={t("admin.clientDetailTotalPaid")}
            value={formatMoney(totalPaid)}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            icon={<PurchaseIcon sx={{ fontSize: 28 }} />}
            label={t("admin.clientDetailTotalPurchases")}
            value={totalPurchasesCount}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Credit Line Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{t("admin.clientDetailCreditLine")}</Typography>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateCLOpen(true)}>
              {t("creditLines.newLine")}
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {creditLines && creditLines.length > 0 ? (
            creditLines.map((cl) => (
              <Box key={cl.id} mb={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="body2" color="text.secondary">{t("creditLines.maxAmount")}</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MoneyDisplay amount={cl.maxAmount} fontWeight={600} />
                      <IconButton size="small" onClick={() => handleEditCreditLine(cl)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="body2" color="text.secondary">{t("creditLines.usedAmount")}</Typography>
                    <MoneyDisplay amount={cl.usedAmount} color="error.main" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="body2" color="text.secondary">{t("creditLines.availableAmount")}</Typography>
                    <MoneyDisplay amount={cl.availableAmount} color="success.main" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="body2" color="text.secondary">{t("loans.interestRate")}</Typography>
                    <Typography fontWeight={500}>{cl.interestRate}%</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography variant="body2" color="text.secondary">{t("creditLines.maxInstallments")}</Typography>
                    <Typography fontWeight={500}>{cl.maxInstallments}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <StatusBadge status={cl.status} />
                    {cl.status === "approved" && (
                      <Box display="flex" gap={0.5} mt={1}>
                        <Button size="small" variant="contained" color="secondary" startIcon={<WithdrawalIcon />} onClick={() => handleOpenLoanDialog(cl, "withdrawal")}>
                          {t("admin.cashWithdrawal")}
                        </Button>
                      </Box>
                    )}
                    {cl.status === "pending" && (
                      <Box display="flex" gap={0.5} mt={1}>
                        <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />}
                          disabled={approveCreditLineMutation.isPending}
                          onClick={() => approveCreditLineMutation.mutate(cl.id)}>
                          {t("creditLines.approve")}
                        </Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />}
                          onClick={() => { setRejectCLId(cl.id); setRejectReason(""); setRejectCLOpen(true); }}>
                          {t("creditLines.reject")}
                        </Button>
                      </Box>
                    )}
                  </Grid>
                </Grid>
                {creditLines.length > 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))
          ) : (
            <Typography color="text.secondary">{t("admin.noCreditLines")}</Typography>
          )}
        </CardContent>
      </Card>

      {/* Payment Evolution Chart */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("admin.clientDetailPaymentEvolution")}</Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                  <Bar dataKey="pagos" name={t("admin.clientDetailPaymentsTab")} fill="#2E7D32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Personal Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">{t("admin.personalInfo")}</Typography>
            <Button size="small" startIcon={<EditIcon />} onClick={handleOpenEditClient}>
              {t("common.edit")}
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("auth.email")}</Typography>
              <Typography>{client.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">DNI</Typography>
              <Typography>{client.dni}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("registration.phone")}</Typography>
              <Typography>{client.phone}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("registration.address")}</Typography>
              <Typography>{client.address}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("registration.city")}</Typography>
              <Typography>{client.city}, {client.province}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("registration.country")}</Typography>
              <Typography>{client.country || "Argentina"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("admin.registrationDate")}</Typography>
              <Typography>{format(new Date(client.createdAt), "dd/MM/yyyy")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">{t("loans.ivaRate")}</Typography>
              {editingIVA ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    size="small"
                    type="number"
                    value={ivaRateValue}
                    onChange={(e) => setIvaRateValue(e.target.value)}
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                    sx={{ width: 100 }}
                  />
                  <Typography variant="body2">%</Typography>
                  <Button size="small" variant="contained"
                    disabled={updateIVARateMutation.isPending}
                    onClick={() => id && updateIVARateMutation.mutate({ clientId: id, ivaRate: parseFloat(ivaRateValue) })}>
                    {t("common.save")}
                  </Button>
                  <Button size="small" onClick={() => setEditingIVA(false)}>{t("common.cancel")}</Button>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography fontWeight={500}>{client.ivaRate}%</Typography>
                  <IconButton size="small" onClick={() => { setIvaRateValue(client.ivaRate || "21"); setEditingIVA(true); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Comments Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">{t("admin.comments")}</Typography>
            {!editingComments && (
              <IconButton size="small" onClick={() => { setCommentsValue(client.comments || ""); setEditingComments(true); }}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {editingComments ? (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={commentsValue}
                onChange={(e) => setCommentsValue(e.target.value)}
                placeholder={t("admin.commentsPlaceholder")}
              />
              <Box display="flex" gap={1} mt={1}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={updateCommentsMutation.isPending}
                  onClick={() => id && updateCommentsMutation.mutate({ clientId: id, comments: commentsValue })}
                >
                  {updateCommentsMutation.isPending ? t("common.saving") : t("common.save")}
                </Button>
                <Button size="small" onClick={() => setEditingComments(false)}>{t("common.cancel")}</Button>
              </Box>
            </Box>
          ) : (
            <Typography color={client.comments ? "text.primary" : "text.secondary"}>
              {client.comments || t("admin.commentsPlaceholder")}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Tables */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label={t("admin.clientDetailLoansTab")} />
            <Tab label={t("admin.clientDetailPaymentsTab")} />
            <Tab label={t("admin.clientDetailPurchasesTab")} />
            <Tab label={t("admin.clientDetailMovementsTab")} />
          </Tabs>
        </Box>
        <CardContent>
          {activeTab === 0 && (
            <DataTable
              columns={loanColumns}
              rows={loansData?.data || []}
              total={loansData?.total || 0}
              page={loansPage - 1}
              pageSize={20}
              onPageChange={(p) => setLoansPage(p + 1)}
              loading={loansLoading}
              keyExtractor={(row) => row.id}
              emptyMessage={t("loans.noLoans")}
            />
          )}
          {activeTab === 1 && (
            <DataTable
              columns={paymentColumns}
              rows={paymentsData?.data || []}
              total={paymentsData?.total || 0}
              page={paymentsPage - 1}
              pageSize={20}
              onPageChange={(p) => setPaymentsPage(p + 1)}
              loading={paymentsLoading}
              keyExtractor={(row) => row.id}
              emptyMessage={t("payments.noPayments")}
            />
          )}
          {activeTab === 2 && (
            <DataTable
              columns={purchaseColumns}
              rows={purchasesData?.data || []}
              total={purchasesData?.total || 0}
              page={purchasesPage - 1}
              pageSize={20}
              onPageChange={(p) => setPurchasesPage(p + 1)}
              loading={purchasesLoading}
              keyExtractor={(row) => row.id}
              emptyMessage={t("admin.noPurchases")}
            />
          )}
          {activeTab === 3 && (
            <DataTable
              columns={movementColumns}
              rows={movementsData?.data || []}
              total={movementsData?.total || 0}
              page={movementsPage - 1}
              pageSize={20}
              onPageChange={(p) => setMovementsPage(p + 1)}
              loading={movementsLoading}
              keyExtractor={(row) => row.id}
              emptyMessage={t("account.noMovements")}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Loan / Withdrawal Dialog */}
      <Dialog open={loanDialogOpen} onClose={handleCloseLoanDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{loanDialogMode === "withdrawal" ? t("admin.cashWithdrawal") : t("admin.createLoan")}</DialogTitle>
        <DialogContent>
          {loanCreditLine && (
            <Box mt={1} display="flex" flexDirection="column" gap={2}>
              <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="body2">
                  {t("creditLines.availableAmount")}: <MoneyDisplay amount={loanCreditLine.availableAmount} variant="body2" color="success.main" />
                  {" | "}{t("loans.interestRate")}: {loanCreditLine.interestRate}%
                  {" | "}{t("creditLines.maxInstallments")}: {loanCreditLine.maxInstallments}
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                label={t("loans.loanAmount")}
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                inputProps={{ min: 1, max: parseFloat(loanCreditLine.availableAmount) }}
              />
              <TextField
                fullWidth
                type="number"
                label={t("loans.numberOfInstallments")}
                value={loanInstallments}
                onChange={(e) => setLoanInstallments(Number(e.target.value))}
                inputProps={{ min: 1, max: loanCreditLine.maxInstallments }}
              />
              <TextField
                select
                fullWidth
                label={t("loans.amortizationSystem")}
                value={loanAmortType}
                onChange={(e) => setLoanAmortType(e.target.value as "french" | "german")}
              >
                <MenuItem value="french">{t("loans.frenchFull")}</MenuItem>
                <MenuItem value="german">{t("loans.germanFull")}</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseLoanDialog}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSubmitLoan}
            disabled={createLoanMutation.isPending || createWithdrawalMutation.isPending || !loanAmount}
          >
            {(createLoanMutation.isPending || createWithdrawalMutation.isPending) ? t("common.creating") : t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Credit Line Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("admin.clientDetailEditLimit")}</DialogTitle>
        <DialogContent>
          {editingCreditLine && (
            <Box mt={1}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {t("creditLines.usedAmount")}: <MoneyDisplay amount={editingCreditLine.usedAmount} />
              </Typography>
              <TextField
                fullWidth
                label={t("admin.clientDetailNewLimit")}
                type="number"
                value={newMaxAmount}
                onChange={(e) => setNewMaxAmount(e.target.value)}
                inputProps={{ min: parseFloat(editingCreditLine.usedAmount) }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={updateCreditLineMutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSaveCreditLine}
            variant="contained"
            disabled={updateCreditLineMutation.isPending || !newMaxAmount}
          >
            {updateCreditLineMutation.isPending ? t("common.processing") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Installment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("admin.payInstallment")}</DialogTitle>
        <DialogContent>
          {paymentLoan && (() => {
            const nextInstallment = (paymentLoan.installments || []).find((i) => i.status !== "paid");
            if (!nextInstallment) return <Alert severity="info" sx={{ mt: 1 }}>{t("loans.noInstallments")}</Alert>;
            return (
              <Box mt={1} display="flex" flexDirection="column" gap={2}>
                <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                  <Typography variant="body2">
                    {t("loans.loanNumber")} #{paymentLoan.id.slice(0, 8)}
                    {" | "}{t("loans.installments")}: #{nextInstallment.number}
                    {" | "}{t("loans.dueDate")}: {format(new Date(nextInstallment.dueDate), "dd/MM/yyyy")}
                    {nextInstallment.status === "overdue" && (
                      <Chip label={t("status.overdue")} size="small" color="error" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{t("loans.capital")}</Typography>
                    <MoneyDisplay amount={nextInstallment.capitalAmount} variant="body2" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{t("loans.interest")}</Typography>
                    <MoneyDisplay amount={nextInstallment.interestAmount} variant="body2" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{t("loans.iva")}</Typography>
                    <MoneyDisplay amount={nextInstallment.ivaAmount} variant="body2" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" pt={1} sx={{ borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="subtitle2">{t("loans.amountToPay")}</Typography>
                    <MoneyDisplay amount={nextInstallment.remainingAmount} fontWeight={700} variant="subtitle2" />
                  </Box>
                </Box>
                <TextField
                  select
                  fullWidth
                  label={t("payments.method")}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="cash">{t("payments.cash")}</MenuItem>
                  <MenuItem value="transfer">{t("payments.transfer")}</MenuItem>
                  <MenuItem value="mercado_pago">{t("payments.mercadoPago")}</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  label={t("admin.paymentReference")}
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPaymentDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!paymentLoan) return;
              const nextInst = (paymentLoan.installments || []).find((i) => i.status !== "paid");
              if (!nextInst) return;
              recordPaymentMutation.mutate({ loanId: paymentLoan.id, installment: nextInst, method: paymentMethod });
            }}
            disabled={recordPaymentMutation.isPending || !(paymentLoan?.installments || []).some((i) => i.status !== "paid")}
          >
            {recordPaymentMutation.isPending ? t("common.processing") : t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Capital Prepay Dialog */}
      <Dialog open={prepayDialogOpen} onClose={() => setPrepayDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("admin.capitalPrepay")}</DialogTitle>
        <DialogContent>
          {prepayLoan && (
            <Box mt={1} display="flex" flexDirection="column" gap={2}>
              <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="body2">
                  {t("loans.loanNumber")} #{prepayLoan.id.slice(0, 8)}
                  {" | "}{t("loans.totalRemaining")}: <MoneyDisplay amount={prepayLoan.totalRemaining} variant="body2" color="error.main" />
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                label={t("admin.prepayAmount")}
                value={prepayAmount}
                onChange={(e) => setPrepayAmount(e.target.value)}
                inputProps={{ min: 1 }}
              />
              <FormControl>
                <FormLabel>{t("admin.prepayStrategy")}</FormLabel>
                <RadioGroup
                  value={prepayStrategy}
                  onChange={(e) => setPrepayStrategy(e.target.value as "reduce_installment" | "reduce_term")}
                >
                  <FormControlLabel value="reduce_installment" control={<Radio />} label={t("admin.prepayReduceInstallment")} />
                  <FormControlLabel value="reduce_term" control={<Radio />} label={t("admin.prepayReduceTerm")} />
                </RadioGroup>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setPrepayDialogOpen(false); setPrepayStrategy("reduce_installment"); }}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => prepayLoan && prepayMutation.mutate({ loanId: prepayLoan.id, amount: prepayAmount, strategy: prepayStrategy })}
            disabled={prepayMutation.isPending || !prepayAmount}
          >
            {prepayMutation.isPending ? t("common.processing") : t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Credit Line Dialog */}
      <Dialog open={createCLOpen} onClose={() => setCreateCLOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("creditLines.create")}</DialogTitle>
        <DialogContent>
          <Box mt={1} display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label={t("admin.client")}
              value={client ? `${client.firstName} ${client.lastName} (DNI: ${client.dni})` : ""}
              InputProps={{ readOnly: true }}
              disabled
            />
            <TextField
              fullWidth
              type="number"
              label={t("creditLines.maxAmount")}
              value={clMaxAmount}
              onChange={(e) => setClMaxAmount(e.target.value)}
              inputProps={{ min: 1000 }}
            />
            <TextField
              fullWidth
              type="number"
              label={t("loans.interestRate") + " (%)"}
              value={clInterestRate}
              onChange={(e) => setClInterestRate(e.target.value)}
              inputProps={{ min: 0.1, step: 0.1 }}
            />
            <TextField
              fullWidth
              type="number"
              label={t("creditLines.maxInstallments")}
              value={clMaxInstallments}
              onChange={(e) => setClMaxInstallments(e.target.value)}
              inputProps={{ min: 1, max: 60 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateCLOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={createCreditLineMutation.isPending}
            onClick={() => id && createCreditLineMutation.mutate({
              clientId: id,
              maxAmount: clMaxAmount,
              interestRate: clInterestRate,
              maxInstallments: Number(clMaxInstallments),
            })}
          >
            {createCreditLineMutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Credit Line Dialog */}
      <Dialog open={rejectCLOpen} onClose={() => setRejectCLOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("creditLines.rejectLine")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t("creditLines.rejectionReason")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectCLOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={rejectCreditLineMutation.isPending || !rejectReason.trim()}
            onClick={() => rejectCLId && rejectCreditLineMutation.mutate({ creditLineId: rejectCLId, reason: rejectReason })}
          >
            {rejectCreditLineMutation.isPending ? t("common.processing") : t("creditLines.reject")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancellation Simulation Dialog */}
      <Dialog open={!!simulateLoan} onClose={() => { setSimulateLoan(null); setSimulationData(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{t("admin.simulateCancellation")}</DialogTitle>
        <DialogContent>
          {simulateLoan && (
            <Box mt={1}>
              <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="body2">
                  {t("loans.loanNumber")} #{simulateLoan.id.slice(0, 8)}
                  {" | "}{t("loans.principal")}: <MoneyDisplay amount={simulateLoan.principal} variant="body2" fontWeight={600} />
                </Typography>
              </Box>
              {simulationLoading ? (
                <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
              ) : simulationData ? (
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>{t("admin.settlementBreakdown")}</Typography>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{t("admin.pendingCapital")}</Typography>
                    <MoneyDisplay amount={simulationData.pendingCapital} variant="body2" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{t("admin.accumulatedInterest")}</Typography>
                    <MoneyDisplay amount={simulationData.accumulatedInterest} variant="body2" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">{t("admin.accumulatedIVA")}</Typography>
                    <MoneyDisplay amount={simulationData.accumulatedIVA} variant="body2" />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={1} pt={1} sx={{ borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="subtitle2">{t("admin.settlementTotal")}</Typography>
                    <MoneyDisplay amount={simulationData.total} fontWeight={700} variant="subtitle2" />
                  </Box>
                </Box>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSimulateLoan(null); setSimulationData(null); }}>{t("common.back")}</Button>
          {simulationData && simulateLoan && (
            <Button
              variant="contained"
              color="error"
              onClick={() => cancelLoanMutation.mutate(simulateLoan.id)}
              disabled={cancelLoanMutation.isPending}
            >
              {cancelLoanMutation.isPending ? t("common.loading") : t("admin.executeCancellation")}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Receipt Download Dialog */}
      <Dialog open={!!lastPayment} onClose={() => setLastPayment(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("admin.paymentRecorded")}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>{t("admin.receiptReady")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLastPayment(null)}>{t("common.back")}</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (lastPayment) {
                handleDownloadReceipt(lastPayment.loanId, lastPayment.paymentId);
                setLastPayment(null);
              }
            }}
          >
            {t("admin.downloadReceipt")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loan Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {t("loans.loanDetail")} #{detailLoan?.id.slice(0, 8)}
        </DialogTitle>
        <DialogContent>
          {detailLoan && (
            <Box mt={1}>
              <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="body2">
                  {t("loans.principal")}: <MoneyDisplay amount={detailLoan.principal} variant="body2" fontWeight={600} />
                  {" | "}{t("loans.interestRate")}: {detailLoan.interestRate}%
                  {" | "}{t("loans.system")}: {detailLoan.amortizationType === "french" ? t("loans.french") : t("loans.german")}
                  {" | "}<StatusBadge status={detailLoan.status} />
                </Typography>
              </Box>
              <DataTable<Installment>
                columns={[
                  { id: "number", label: "#", align: "center" },
                  { id: "dueDate", label: t("loans.dueDate"), render: (row) => format(new Date(row.dueDate), "dd/MM/yyyy") },
                  { id: "capitalAmount", label: t("loans.capital"), align: "right", render: (row) => <MoneyDisplay amount={row.capitalAmount} /> },
                  { id: "interestAmount", label: t("loans.interest"), align: "right", render: (row) => <MoneyDisplay amount={row.interestAmount} /> },
                  { id: "ivaAmount", label: t("loans.iva"), align: "right", render: (row) => <MoneyDisplay amount={row.ivaAmount} /> },
                  { id: "totalAmount", label: t("loans.installmentTotal"), align: "right", render: (row) => <MoneyDisplay amount={row.totalAmount} fontWeight={600} /> },
                  { id: "paidAmount", label: t("loans.paid"), align: "right", render: (row) => <MoneyDisplay amount={row.paidAmount} /> },
                  { id: "remainingAmount", label: t("loans.remaining"), align: "right", render: (row) => <MoneyDisplay amount={row.remainingAmount} /> },
                  { id: "status", label: t("common.status"), render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={detailLoan.installments || []}
                keyExtractor={(row) => row.id || String(row.number)}
                emptyMessage={t("loans.noInstallments")}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={async () => {
              if (!detailLoan) return;
              try {
                const blob = await adminDownloadLoanSchedule(detailLoan.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `plan-cuotas-${detailLoan.id.slice(0, 8)}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch {
                showError(t("admin.receiptDownloadError"));
              }
            }}
          >
            {t("loans.downloadSchedule")}
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>{t("common.back")}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editClientOpen} onClose={() => setEditClientOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("admin.editClient")}</DialogTitle>
        <DialogContent>
          <Box mt={1} display="flex" flexDirection="column" gap={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={t("registration.firstName")} value={editClientData.firstName}
                  onChange={(e) => setEditClientData({ ...editClientData, firstName: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={t("registration.lastName")} value={editClientData.lastName}
                  onChange={(e) => setEditClientData({ ...editClientData, lastName: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="DNI" value={editClientData.dni}
                  onChange={(e) => setEditClientData({ ...editClientData, dni: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="CUIT" value={editClientData.cuit}
                  onChange={(e) => setEditClientData({ ...editClientData, cuit: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={t("registration.phone")} value={editClientData.phone}
                  onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label={t("registration.address")} value={editClientData.address}
                  onChange={(e) => setEditClientData({ ...editClientData, address: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label={t("registration.city")} value={editClientData.city}
                  onChange={(e) => setEditClientData({ ...editClientData, city: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label={t("registration.province")} value={editClientData.province}
                  onChange={(e) => setEditClientData({ ...editClientData, province: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label={t("registration.country")} value={editClientData.country}
                  onChange={(e) => setEditClientData({ ...editClientData, country: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Radio checked={editClientData.isPEP}
                      onClick={() => setEditClientData({ ...editClientData, isPEP: !editClientData.isPEP })} />
                  }
                  label={t("registration.isPEP")}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditClientOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={updateClientMutation.isPending}
            onClick={() => id && updateClientMutation.mutate({ clientId: id, data: editClientData })}
          >
            {updateClientMutation.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ClientDetail;
