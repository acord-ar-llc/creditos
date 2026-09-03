import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Google as GoogleIcon,
} from "@mui/icons-material";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import { useFirebasePhoneAuth } from "../../firebase/useFirebasePhoneAuth";
import { useFirebaseGoogleAuth } from "../../firebase/useFirebaseGoogleAuth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { requestOTP, verifyOTP, firebaseLogin } = useAuth();
  const { t } = useTranslation();
  const { showError } = useNotification();

  const [tab, setTab] = useState(0); // 0 = client/vendor (OTP), 1 = admin (Google OAuth)
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { sendSMS, verifyCode, loading: smsLoading } = useFirebasePhoneAuth();
  const { signInWithGoogle, loading: googleLoading } = useFirebaseGoogleAuth();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channel === "email" && !email) return;
    if (channel === "phone" && !phone) return;
    setLoading(true);
    try {
      if (channel === "email") {
        await requestOTP(email);
      } else {
        await sendSMS(phone, "recaptcha-container");
      }
      setOtpSent(true);
    } catch (err: unknown) {
      showError(
        getErrorMessage(
          err,
          channel === "phone"
            ? t("auth.smsError")
            : t("auth.invalidCredentials")
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    try {
      if (channel === "email") {
        await verifyOTP(email, otpCode);
      } else {
        // Phone: verify via Firebase, then send ID token to backend
        const idToken = await verifyCode(otpCode);
        await firebaseLogin(idToken);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      showError(getErrorMessage(err, t("auth.otpError")));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const idToken = await signInWithGoogle();
      await firebaseLogin(idToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      showError(getErrorMessage(err, t("auth.googleError")));
    }
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpCode("");
  };

  const isLoading = loading || smsLoading || googleLoading;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1B5E20 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: "100%", p: 1 }}>
        <CardContent>
          <Box textAlign="center" mb={2}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <LanguageSwitcher />
            </Box>
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Prestia"
              sx={{ height: 56, mb: 1 }}
            />
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {t("common.appName")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("auth.login")}
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              resetOtpFlow();
            }}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label={t("auth.clientLogin")} />
            <Tab label={t("auth.adminLogin")} />
          </Tabs>

          {/* Client/Vendor OTP Login */}
          {tab === 0 && !otpSent && (
            <form onSubmit={handleRequestOTP}>
              <ToggleButtonGroup
                value={channel}
                exclusive
                onChange={(_, v) => {
                  if (v) setChannel(v);
                }}
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="email">
                  <EmailIcon sx={{ mr: 0.5 }} fontSize="small" />
                  {t("auth.otpChannelEmail")}
                </ToggleButton>
                <ToggleButton value="phone">
                  <PhoneIcon sx={{ mr: 0.5 }} fontSize="small" />
                  {t("auth.otpChannelPhone")}
                </ToggleButton>
              </ToggleButtonGroup>

              {channel === "email" ? (
                <TextField
                  fullWidth
                  label={t("auth.email")}
                  type="email"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  fullWidth
                  label={t("auth.phoneNumber")}
                  type="tel"
                  margin="normal"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 11 4051 0100"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={
                  isLoading ||
                  (channel === "email" ? !email : !phone)
                }
                sx={{ mt: 2, mb: 2, py: 1.5 }}
              >
                {isLoading
                  ? channel === "phone"
                    ? t("auth.sendingSms")
                    : t("auth.sendingOtp")
                  : t("auth.requestOtp")}
              </Button>
            </form>
          )}

          {/* OTP Verification Step */}
          {tab === 0 && otpSent && (
            <form onSubmit={handleVerifyOTP}>
              <Alert severity="info" sx={{ mb: 2 }}>
                {channel === "phone"
                  ? t("auth.otpSentPhone")
                  : t("auth.otpSent")}
              </Alert>
              <TextField
                fullWidth
                label={t("auth.enterOtp")}
                margin="normal"
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(val);
                }}
                inputProps={{ maxLength: 6, inputMode: "numeric" }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || otpCode.length !== 6}
                sx={{ mt: 2, mb: 1, py: 1.5 }}
              >
                {isLoading ? t("auth.verifyingOtp") : t("auth.verifyOtp")}
              </Button>
              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={resetOtpFlow}
              >
                {t("common.back")}
              </Button>
            </form>
          )}

          {/* Admin Login (Google OAuth) */}
          {tab === 1 && (
            <Box>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                sx={{ mt: 2, mb: 2, py: 1.5 }}
              >
                {googleLoading
                  ? t("common.loading")
                  : t("auth.googleSignIn")}
              </Button>
            </Box>
          )}

        </CardContent>
      </Card>
      <div id="recaptcha-container" />
    </Box>
  );
};

export default Login;
