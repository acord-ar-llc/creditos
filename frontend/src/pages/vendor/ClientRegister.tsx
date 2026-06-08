import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { vendorRegisterClient } from "../../api/endpoints";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import type { Client } from "../../api/types";
import LocationSelector from "../../components/LocationSelector";
import { useCountryConfig, countryNameFor } from "../../config/countryConfig";

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().min(6).max(11),
  cuit: z.string().min(9).max(16),
  dateOfBirth: z.string().min(1),
  phone: z.string().min(8),
  address: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  isPEP: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const ClientRegister: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const config = useCountryConfig();
  const [registeredClient, setRegisteredClient] = useState<Client | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      dni: "",
      cuit: "",
      dateOfBirth: "",
      phone: "",
      address: "",
      country: countryNameFor(config.country),
      city: "",
      province: "",
      isPEP: false,
    },
  });

  const mutation = useMutation({
    mutationFn: vendorRegisterClient,
    onSuccess: (client) => {
      setRegisteredClient(client);
      showSuccess(t("vendor.clientRegisterSuccess"));
    },
    onError: (err) => {
      showError(getErrorMessage(err, t("vendor.clientRegisterError")));
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (registeredClient) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t("vendor.registerClient")}
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          {t("vendor.clientRegisteredSuccessfully", {
            name: `${registeredClient.firstName} ${registeredClient.lastName}`,
          })}
        </Alert>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("vendor.registeredClientDetails")}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  {t("vendor.fullName")}
                </Typography>
                <Typography fontWeight={600}>
                  {registeredClient.firstName} {registeredClient.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  DNI
                </Typography>
                <Typography fontWeight={600}>
                  {registeredClient.dni}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography fontWeight={600}>
                  {registeredClient.email}
                </Typography>
              </Grid>
            </Grid>

            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="contained"
                onClick={() => navigate("/vendor/purchases/new")}
              >
                {t("vendor.newPurchase")}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setRegisteredClient(null);
                }}
              >
                {t("vendor.registerAnother")}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t("vendor.registerClient")}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("vendor.registerClientDescription")}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t("registration.firstName")}
                      error={!!errors.firstName}
                      helperText={
                        errors.firstName
                          ? t("vendor.fieldRequired")
                          : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t("registration.lastName")}
                      error={!!errors.lastName}
                      helperText={
                        errors.lastName
                          ? t("vendor.fieldRequired")
                          : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="dni"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={config.nationalIdLabel}
                      error={!!errors.dni}
                      helperText={
                        errors.dni ? t("vendor.dniInvalid") : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="cuit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={config.taxIdLabel}
                      error={!!errors.cuit}
                      helperText={
                        errors.cuit ? t("vendor.cuitInvalid") : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label={t("vendor.dateOfBirth")}
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.dateOfBirth}
                      helperText={
                        errors.dateOfBirth
                          ? t("vendor.fieldRequired")
                          : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t("registration.phone")}
                      error={!!errors.phone}
                      helperText={
                        errors.phone ? t("vendor.phoneInvalid") : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t("auth.email")}
                      type="email"
                      error={!!errors.email}
                      helperText={
                        errors.email ? t("vendor.emailInvalid") : undefined
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t("registration.address")}
                      error={!!errors.address}
                      helperText={
                        errors.address ? t("vendor.fieldRequired") : undefined
                      }
                    />
                  )}
                />
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
              <Grid item xs={12}>
                <Controller
                  name="isPEP"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={t("vendor.isPEP")}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending
                      ? t("common.saving")
                      : t("vendor.registerClientButton")}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/vendor/purchases/new")}
                  >
                    {t("common.back")}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

    </Box>
  );
};

export default ClientRegister;
