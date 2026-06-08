import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  TrendingUp as InterestIcon,
  AccountBalance as CapitalIcon,
  Receipt as IVAIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getFinancialReport, getPortfolioPosition } from "../../api/endpoints";
import KPICard from "../../components/KPICard";
import { formatMoney } from "../../config/countryConfig";

const fmt = (v: string) => formatMoney(v);

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>();
  const [appliedTo, setAppliedTo] = useState<string | undefined>();

  const financialQuery = useQuery({
    queryKey: ["financialReport", appliedFrom, appliedTo],
    queryFn: () => getFinancialReport(appliedFrom, appliedTo),
  });

  const portfolioQuery = useQuery({
    queryKey: ["portfolioPosition", appliedFrom, appliedTo],
    queryFn: () => getPortfolioPosition(appliedFrom, appliedTo),
  });

  const handleFilter = () => {
    setAppliedFrom(from || undefined);
    setAppliedTo(to || undefined);
  };

  const report = financialQuery.data;
  const positions = portfolioQuery.data?.items || [];
  const loading = financialQuery.isLoading || portfolioQuery.isLoading;
  const error = financialQuery.error || portfolioQuery.error;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t("reports.title")}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("reports.description")}
      </Typography>

      {/* Date range filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            label={t("reports.from")}
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label={t("reports.to")}
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" startIcon={<FilterIcon />} onClick={handleFilter}>
            {t("reports.filter")}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error).message}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* KPI Cards */}
      {report && (
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              icon={<InterestIcon />}
              label={t("reports.interestAccrued")}
              value={fmt(report.interestAccrued)}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              icon={<InterestIcon />}
              label={t("reports.interestCollected")}
              value={fmt(report.interestCollected)}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              icon={<IVAIcon />}
              label={t("reports.ivaAccrued")}
              value={fmt(report.ivaAccrued)}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              icon={<IVAIcon />}
              label={t("reports.ivaCollected")}
              value={fmt(report.ivaCollected)}
              color="#9c27b0"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              icon={<CapitalIcon />}
              label={t("reports.capitalCollected")}
              value={fmt(report.capitalCollected)}
              color="#0288d1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <KPICard
              icon={<CapitalIcon />}
              label={t("reports.capitalPending")}
              value={fmt(report.capitalPending)}
              color="#d32f2f"
            />
          </Grid>
        </Grid>
      )}

      {/* Portfolio Position Table */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        {t("reports.portfolioPosition")}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("common.status")}</TableCell>
              <TableCell align="right">{t("reports.loanCount")}</TableCell>
              <TableCell align="right">{t("reports.totalPrincipal")}</TableCell>
              <TableCell align="right">{t("reports.totalOutstanding")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              positions.map((pos) => (
                <TableRow key={pos.status}>
                  <TableCell>{t(`status.${pos.status}`, pos.status)}</TableCell>
                  <TableCell align="right">{pos.loanCount}</TableCell>
                  <TableCell align="right">{fmt(pos.totalPrincipal)}</TableCell>
                  <TableCell align="right">{fmt(pos.totalOutstanding)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Reports;
