import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Grid, Card, CardContent, Skeleton } from "@mui/material";
import {
  People as PeopleIcon,
  CreditCard as CreditIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Percent as PercentIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getKPIs, getDisbursementTrends, getCollectionTrends, getDelinquency } from "../../api/endpoints";
import KPICard from "../../components/KPICard";
import { useTranslation } from "react-i18next";
import { formatMoney as fmtMoney } from "../../config/countryConfig";

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: getKPIs,
  });

  const { data: disbursementTrends } = useQuery({
    queryKey: ["admin-disbursement-trends"],
    queryFn: getDisbursementTrends,
  });

  const { data: collectionTrends } = useQuery({
    queryKey: ["admin-collection-trends"],
    queryFn: getCollectionTrends,
  });

  const { data: delinquency } = useQuery({
    queryKey: ["admin-delinquency"],
    queryFn: getDelinquency,
  });

  const formatMoney = (amount: number) =>
    fmtMoney(amount, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

  const combinedTrends = (disbursementTrends || []).map((d, idx) => ({
    month: d.month,
    desembolsos: d.amount,
    cobranzas: collectionTrends?.[idx]?.amount || 0,
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t("nav.dashboard")}</Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("dashboard.portfolioSummary")}
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {kpisLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.totalClients")}
              value={kpis?.totalClients || 0}
              color="primary.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {kpisLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<CreditIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.activeLoans")}
              value={kpis?.activeLoans || 0}
              color="info.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {kpisLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<MoneyIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.totalDisbursed")}
              value={formatMoney(kpis?.totalDisbursed || 0)}
              color="secondary.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {kpisLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<WarningIcon sx={{ fontSize: 28 }} />}
              label={t("dashboard.delinquencyRate")}
              value={`${(kpis?.delinquencyRate || 0).toFixed(1)}%`}
              color="error.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {kpisLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<PercentIcon sx={{ fontSize: 28 }} />}
              label="Tasa Cobranza"
              value={`${(kpis?.collectionRate || 0).toFixed(1)}%`}
              color="success.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          {kpisLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <KPICard
              icon={<TrendingIcon sx={{ fontSize: 28 }} />}
              label="Monto Promedio"
              value={formatMoney(kpis?.averageLoanAmount || 0)}
              color="warning.main"
            />
          )}
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>
        {t("dashboard.delinquency")}
      </Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <KPICard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            label={t("dashboard.par30")}
            value={formatMoney(delinquency?.par30 || 0)}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KPICard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            label={t("dashboard.par60")}
            value={formatMoney(delinquency?.par60 || 0)}
            color="warning.dark"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KPICard
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            label={t("dashboard.par90")}
            value={formatMoney(delinquency?.par90 || 0)}
            color="error.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("dashboard.disbursementTrend")} vs {t("dashboard.collectionTrend")}
              </Typography>
              <Box sx={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={combinedTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatMoney(value)} />
                    <Legend />
                    <Bar dataKey="desembolsos" name="Desembolsos" fill="#1565C0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cobranzas" name="Cobranzas" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
