import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Skeleton,
  Alert,
} from "@mui/material";
import {
  AccountBalance as AccountIcon,
  CreditCard as CreditIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { getAccount, getLoans } from "../../api/endpoints";
import { useAuth } from "../../auth/AuthContext";
import MoneyDisplay from "../../components/MoneyDisplay";
import StatusBadge from "../../components/StatusBadge";
import KPICard from "../../components/KPICard";
import { formatMoney as fmtMoney } from "../../config/countryConfig";

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account"],
    queryFn: getAccount,
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  });

  const activeLoans = loans?.filter((l) => l.status === "active" || l.status === "disbursed") || [];
  const totalDebt = activeLoans.reduce((sum, l) => sum + (parseFloat(l.totalRemaining) || 0), 0);

  const formatMoney = (amount: number) => fmtMoney(amount);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t("dashboard.welcome")}, {user?.firstName || user?.email}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("dashboard.accountSummary")}
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          {accountLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<AccountIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.accountBalance")}
              value={formatMoney(parseFloat(account?.balance || "0"))}
              color="primary.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {loansLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<CreditIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.activeLoans")}
              value={activeLoans.length}
              color="secondary.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {loansLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<TrendingIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.totalDebt")}
              value={formatMoney(totalDebt)}
              color="warning.main"
            />
          )}
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{t("dashboard.recentLoans")}</Typography>
        <Button variant="text" onClick={() => navigate("/loans")}>
          {t("common.viewAll")}
        </Button>
      </Box>

      {loansLoading ? (
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      ) : loans && loans.length > 0 ? (
        <Grid container spacing={2}>
          {loans.slice(0, 3).map((loan) => (
            <Grid item xs={12} md={4} key={loan.id}>
              <Card
                sx={{ cursor: "pointer", "&:hover": { boxShadow: 4 } }}
                onClick={() => navigate(`/loans/${loan.id}`)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t("loans.loanNumber")} #{loan.id.slice(0, 8)}
                    </Typography>
                    <StatusBadge status={loan.status} />
                  </Box>
                  <MoneyDisplay amount={loan.principal} variant="h6" fontWeight={600} />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {loan.numInstallments} {t("loans.installments")} - {loan.amortizationType === "french" ? t("loans.french") : t("loans.german")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("loans.interestRate")}: {loan.interestRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t("dashboard.noLoansYet")}{" "}
          <Button size="small" onClick={() => navigate("/loans/apply")}>
            {t("dashboard.requestOne")}
          </Button>
        </Alert>
      )}
    </Box>
  );
};

export default ClientDashboard;
