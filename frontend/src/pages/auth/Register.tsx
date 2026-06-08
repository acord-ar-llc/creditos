import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import LocationSelector from "../../components/LocationSelector";
import { useCountryConfig, countryNameFor } from "../../config/countryConfig";

// Identity length bounds cover both Argentina (DNI 7-8 / CUIT 11) and
// Colombia (Cédula 6-10 / NIT 9-16). Exact per-country rules are enforced
// by the backend according to the deployment country.
const schema = z.object({
  email: z.string().email("Email invalido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  dni: z.string().min(6, "Documento invalido").max(11, "Documento invalido"),
  cuit: z.string().min(9, "Identificación fiscal invalida").max(16, "Identificación fiscal invalida"),
  dateOfBirth: z.string().min(1, "Fecha de nacimiento requerida"),
  phone: z.string().min(8, "Telefono invalido"),
  address: z.string().min(1, "Direccion requerida"),
  country: z.string().min(1, "Pais requerido"),
  city: z.string().min(1, "Ciudad requerida"),
  province: z.string().min(1, "Provincia requerida"),
  isPEP: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);
  const { showError } = useNotification();
  const config = useCountryConfig();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      firstName: "", lastName: "", dni: "", cuit: "",
      dateOfBirth: "", phone: "", address: "", country: countryNameFor(config.country), city: "", province: "",
      isPEP: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authRegister(data);
      navigate("/dashboard");
    } catch (err: unknown) {
      showError(getErrorMessage(err, t("auth.registerError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1B5E20 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 640, width: "100%", p: 1 }}>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <Box component="img" src={`${import.meta.env.BASE_URL}logo.png`} alt="Prestia" sx={{ height: 56, mb: 1 }} />
            <Typography variant="h5" fontWeight={700} color="primary.main">
              {t("common.appName")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("registration.title")}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="firstName" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={t("registration.firstName")} error={!!errors.firstName} helperText={errors.firstName?.message} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="lastName" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={t("registration.lastName")} error={!!errors.lastName} helperText={errors.lastName?.message} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="dni" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={config.nationalIdLabel} error={!!errors.dni} helperText={errors.dni?.message} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={t("registration.phone")} error={!!errors.phone} helperText={errors.phone?.message} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="cuit" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={config.taxIdLabel} error={!!errors.cuit} helperText={errors.cuit?.message} />
                  )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="dateOfBirth" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth type="date" label={t("registration.dateOfBirth")} InputLabelProps={{ shrink: true }} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="email" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={t("auth.email")} type="email" error={!!errors.email} helperText={errors.email?.message} />
                  )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="address" control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={t("registration.address")} error={!!errors.address} helperText={errors.address?.message} />
                  )} />
              </Grid>
              <LocationSelector
                country={watch("country")}
                province={watch("province")}
                city={watch("city")}
                onChange={(field, value) => setValue(field, value, { shouldValidate: true })}
                errors={{
                  country: !!errors.country,
                  province: !!errors.province,
                  city: !!errors.city,
                }}
              />
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? t("auth.registering") : t("registration.submit")}
            </Button>
          </form>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              {t("auth.hasAccount")}{" "}
              <Link component={RouterLink} to="/login" underline="hover">
                {t("auth.loginHere")}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
