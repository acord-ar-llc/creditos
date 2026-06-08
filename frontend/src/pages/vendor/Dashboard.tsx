import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Button,
  Skeleton,
  Alert,
} from "@mui/material";
import {
  ShoppingCart as SalesIcon,
  AccountBalance as BalanceIcon,
  Payments as PaymentsIcon,
  Receipt as PurchasesIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import {
  getVendorProfile,
  getVendorAccount,
  getVendorPurchases,
} from "../../api/endpoints";
import KPICard from "../../components/KPICard";
import { formatMoney as fmtMoney } from "../../config/countryConfig";

const VendorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: getVendorProfile,
  });

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["vendor-account"],
    queryFn: getVendorAccount,
  });

  const { data: purchasesData, isLoading: purchasesLoading } = useQuery({
    queryKey: ["vendor-purchases-dashboard"],
    queryFn: () => getVendorPurchases(1, 100),
  });

  const purchases = purchasesData?.data || [];
  const totalSales = purchases.reduce(
    (sum, p) => sum + parseFloat(p.amount),
    0
  );
  const recentPurchasesCount = purchases.length;

  const formatMoney = (amount: number) => fmtMoney(amount);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t("vendor.dashboard")}
      </Typography>
      {profileLoading ? (
        <Skeleton variant="text" width={300} height={32} />
      ) : (
        <Typography variant="body1" color="text.secondary" mb={3}>
          {t("vendor.welcome")}, {profile?.businessName}
        </Typography>
      )}

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          {purchasesLoading ? (
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          ) : (
            <KPICard
              icon={<SalesIcon sx={{ fontSize: 28 }} />}
              label={t("vendor.totalSales")}
              value={formatMoney(totalSales)}
              color="primary.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {accountLoading ? (
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          ) : (
            <KPICard
              icon={<BalanceIcon sx={{ fontSize: 28 }} />}
              label={t("vendor.currentBalance")}
              value={formatMoney(parseFloat(account?.balance || "0"))}
              color="secondary.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {purchasesLoading ? (
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          ) : (
            <KPICard
              icon={<PaymentsIcon sx={{ fontSize: 28 }} />}
              label={t("vendor.paymentsReceived")}
              value={formatMoney(parseFloat(account?.balance || "0"))}
              color="success.main"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {purchasesLoading ? (
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          ) : (
            <KPICard
              icon={<PurchasesIcon sx={{ fontSize: 28 }} />}
              label={t("vendor.recentPurchases")}
              value={recentPurchasesCount}
              color="warning.main"
            />
          )}
        </Grid>
      </Grid>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          startIcon={<SalesIcon />}
          onClick={() => navigate("/vendor/purchases/new")}
        >
          {t("vendor.newPurchase")}
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate("/vendor/purchases")}
        >
          {t("vendor.viewPurchases")}
        </Button>
      </Box>

      {!purchasesLoading && purchases.length === 0 && (
        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
          {t("vendor.noPurchasesYet")}
        </Alert>
      )}
    </Box>
  );
};

export default VendorDashboard;
