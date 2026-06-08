import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountIcon,
  CreditCard as CreditIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  People as PeopleIcon,
Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  ExitToApp as LogoutIcon,
  RequestQuote as RequestQuoteIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Assessment as AssessmentIcon,
  MoneyOff as CollectionsIcon,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const clientNavItemsI18n: NavItem[] = [
    { label: t("nav.dashboard"), path: "/dashboard", icon: <DashboardIcon /> },
    { label: t("nav.account"), path: "/account", icon: <AccountIcon /> },
    { label: t("nav.loans"), path: "/loans", icon: <CreditIcon /> },
    { label: t("nav.creditApplication"), path: "/loans/apply", icon: <RequestQuoteIcon /> },
    { label: t("nav.payments"), path: "/payments", icon: <PaymentIcon /> },
    { label: t("nav.profile"), path: "/profile", icon: <PersonIcon /> },
  ];

  const vendorNavItemsI18n: NavItem[] = [
    { label: t("nav.vendorDashboard"), path: "/vendor/dashboard", icon: <DashboardIcon /> },
    { label: t("nav.newPurchase"), path: "/vendor/purchases/new", icon: <ShoppingCartIcon /> },
    { label: t("nav.purchaseHistory"), path: "/vendor/purchases", icon: <ReceiptIcon /> },
    { label: t("nav.vendorBalance"), path: "/vendor/balance", icon: <AccountIcon /> },
    { label: t("nav.vendorProfile"), path: "/vendor/profile", icon: <PersonIcon /> },
  ];

  const adminNavItemsI18n: NavItem[] = [
    { label: t("nav.dashboard"), path: "/admin/dashboard", icon: <DashboardIcon /> },
    { label: t("nav.clients"), path: "/admin/clients", icon: <PeopleIcon /> },
{ label: t("nav.loanManagement"), path: "/admin/loans", icon: <GavelIcon /> },
    { label: t("nav.collections"), path: "/admin/collections", icon: <CollectionsIcon /> },
    { label: t("nav.reports"), path: "/admin/reports", icon: <AssessmentIcon /> },
    { label: t("nav.auditLog"), path: "/admin/audit", icon: <HistoryIcon /> },
    { label: t("nav.vendors"), path: "/admin/vendors", icon: <StoreIcon /> },
  ];

  const navItems = user?.role === "admin" ? adminNavItemsI18n : user?.role === "vendor" ? vendorNavItemsI18n : clientNavItemsI18n;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login");
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box component="img" src={`${import.meta.env.BASE_URL}logo.png`} alt="Prestia" sx={{ height: 32 }} />
        <Typography variant="h6" color="primary" fontWeight={700} noWrap>
          Prestia
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavClick(item.path)}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": { backgroundColor: "primary.dark" },
                  "& .MuiListItemIcon-root": { color: "white" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "white",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageSwitcher />
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
                {user?.email?.[0]?.toUpperCase() || "U"}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> {t("auth.logout")}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: "1px solid rgba(0,0,0,0.08)",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: "64px",
          backgroundColor: "background.default",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;
