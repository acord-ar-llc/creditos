import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Alert,
  CircularProgress,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  vendorSearchClients,
  vendorGetClientCreditLines,
  vendorRecordPurchase,
} from "../../api/endpoints";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import MoneyDisplay from "../../components/MoneyDisplay";
import { formatMoney as fmtMoney } from "../../config/countryConfig";
import type { Client, CreditLine } from "../../api/types";

const NewPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const steps = [
    t("vendor.stepSearchClient"),
    t("vendor.stepSelectCreditLine"),
    t("vendor.stepConfirmPurchase"),
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searchError, setSearchError] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [loadingCreditLines, setLoadingCreditLines] = useState(false);
  const [selectedCreditLine, setSelectedCreditLine] =
    useState<CreditLine | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [amountError, setAmountError] = useState("");
  const [numInstallments, setNumInstallments] = useState(1);
  const [amortizationType, setAmortizationType] = useState<"french" | "german">("french");

  const formatMoney = (value: number) => fmtMoney(value);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const result = await vendorSearchClients(searchQuery.trim());
      setSearchResults(result.data || []);
      if ((result.data || []).length === 0) {
        setSearchError(t("vendor.noClientsFound"));
      }
    } catch {
      setSearchError(t("vendor.searchError"));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setLoadingCreditLines(true);
    try {
      const lines = await vendorGetClientCreditLines(client.id);
      const approvedLines = lines.filter((l) => l.status === "approved" || l.status === "active");
      setCreditLines(approvedLines);
      setActiveStep(1);
    } catch (err) {
      showError(getErrorMessage(err, t("vendor.creditLinesError")));
    } finally {
      setLoadingCreditLines(false);
    }
  };

  const handleSelectCreditLine = (line: CreditLine) => {
    setSelectedCreditLine(line);
    setAmount("");
    setDescription("");
    setAmountError("");
    setNumInstallments(1);
    setAmortizationType("french");
    setActiveStep(2);
  };

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue <= 0) {
      setAmountError(t("vendor.amountRequired"));
      return false;
    }
    const available = selectedCreditLine
      ? parseFloat(selectedCreditLine.availableAmount) || 0
      : 0;
    if (numValue > available) {
      setAmountError(t("vendor.amountExceedsAvailable"));
      return false;
    }
    setAmountError("");
    return true;
  };

  const purchaseMutation = useMutation({
    mutationFn: vendorRecordPurchase,
    onSuccess: () => {
      showSuccess(t("vendor.purchaseSuccess"));
      setTimeout(() => navigate("/vendor/purchases"), 1500);
    },
    onError: (err) => {
      showError(getErrorMessage(err, t("vendor.purchaseError")));
    },
  });

  const handleConfirmPurchase = () => {
    if (!validateAmount(amount)) return;
    if (!selectedClient || !selectedCreditLine) return;

    purchaseMutation.mutate({
      clientId: selectedClient.id,
      creditLineId: selectedCreditLine.id,
      amount: amount,
      description: description,
      numInstallments,
      amortizationType,
    });
  };

  const availableBalance = selectedCreditLine
    ? parseFloat(selectedCreditLine.availableAmount) || 0
    : 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t("vendor.newPurchase")}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("vendor.searchClient")}
            </Typography>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                fullWidth
                label={t("vendor.searchByDniOrName")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                startIcon={
                  searching ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SearchIcon />
                  )
                }
                sx={{ minWidth: 120 }}
              >
                {t("vendor.search")}
              </Button>
            </Box>

            {searchError && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {searchError}
              </Alert>
            )}

            {searchResults.length > 0 && (
              <List>
                {searchResults.map((client) => (
                  <React.Fragment key={client.id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => handleSelectClient(client)}
                        disabled={loadingCreditLines}
                      >
                        <ListItemText
                          primary={`${client.firstName} ${client.lastName}`}
                          secondary={`DNI: ${client.dni} | ${client.email}`}
                        />
                      </ListItemButton>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                {t("vendor.clientNotFound")}{" "}
                <Link
                  component={RouterLink}
                  to="/vendor/clients/register"
                  underline="hover"
                >
                  {t("vendor.registerNewClient")}
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && selectedClient && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("vendor.selectCreditLine")}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t("vendor.clientSelected")}:{" "}
              <strong>
                {selectedClient.firstName} {selectedClient.lastName}
              </strong>{" "}
              (DNI: {selectedClient.dni})
            </Typography>

            {creditLines.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t("vendor.noCreditLines")}
              </Alert>
            ) : (
              <List>
                {creditLines.map((line) => {
                  const available = parseFloat(line.availableAmount) || 0;
                  return (
                    <React.Fragment key={line.id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handleSelectCreditLine(line)}
                        >
                          <ListItemText
                            primary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography>
                                  {t("vendor.creditLine")} #{line.id.slice(0, 8)}
                                </Typography>
                                <MoneyDisplay
                                  amount={available}
                                  fontWeight={600}
                                  color="success.main"
                                />
                              </Box>
                            }
                            secondary={`${t("vendor.maxAmount")}: ${formatMoney(parseFloat(line.maxAmount) || 0)} | ${t("vendor.used")}: ${formatMoney(parseFloat(line.usedAmount) || 0)} | ${t("vendor.available")}: ${formatMoney(available)}`}
                          />
                        </ListItemButton>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  );
                })}
              </List>
            )}

            <Box mt={2}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                {t("common.back")}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && selectedClient && selectedCreditLine && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("vendor.purchaseDetails")}
            </Typography>

            <Box mb={3}>
              <Typography variant="body2" color="text.secondary">
                {t("vendor.clientSelected")}:{" "}
                <strong>
                  {selectedClient.firstName} {selectedClient.lastName}
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("vendor.creditLine")} #{selectedCreditLine.id.slice(0, 8)} |{" "}
                {t("vendor.available")}:{" "}
                <MoneyDisplay
                  amount={availableBalance}
                  fontWeight={600}
                  color="success.main"
                />
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t("vendor.purchaseAmount")}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (amountError) validateAmount(e.target.value);
                  }}
                  error={!!amountError}
                  helperText={
                    amountError ||
                    `${t("vendor.maxAvailable")}: ${formatMoney(availableBalance)}`
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t("vendor.purchaseDescription")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t("vendor.installments")}</InputLabel>
                  <Select
                    value={numInstallments}
                    label={t("vendor.installments")}
                    onChange={(e) => setNumInstallments(Number(e.target.value))}
                  >
                    {Array.from(
                      { length: selectedCreditLine?.maxInstallments || 1 },
                      (_, i) => i + 1
                    ).map((n) => (
                      <MenuItem key={n} value={n}>
                        {n}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t("vendor.amortizationSystem")}</InputLabel>
                  <Select
                    value={amortizationType}
                    label={t("vendor.amortizationSystem")}
                    onChange={(e) => setAmortizationType(e.target.value as "french" | "german")}
                  >
                    <MenuItem value="french">{t("loans.frenchFull")}</MenuItem>
                    <MenuItem value="german">{t("loans.germanFull")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box display="flex" gap={2} mt={3}>
              <Button variant="outlined" onClick={() => setActiveStep(1)}>
                {t("common.back")}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={handleConfirmPurchase}
                disabled={
                  purchaseMutation.isPending || !amount || !!amountError
                }
              >
                {purchaseMutation.isPending
                  ? t("common.sending")
                  : t("vendor.confirmPurchase")}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

    </Box>
  );
};

export default NewPurchase;
