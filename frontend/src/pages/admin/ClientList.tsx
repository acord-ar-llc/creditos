import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Grid,
  FormHelperText,
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { adminGetClients, adminSearchClients, adminRegisterClient } from "../../api/endpoints";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import type { Client } from "../../api/types";
import LocationSelector from "../../components/LocationSelector";
import { useCountryConfig, countryNameFor } from "../../config/countryConfig";

// Mirrors the required fields of the backend RegisterRequest, so the dialog can
// no longer submit a client the API will reject.
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

type RegisterFormData = z.infer<typeof schema>;

const emptyForm: RegisterFormData = {
  email: "", firstName: "", lastName: "",
  dni: "", cuit: "", dateOfBirth: "", phone: "",
  address: "", country: "Argentina", city: "", province: "", isPEP: false,
};

const ClientList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = useCountryConfig();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyForm, country: countryNameFor(config.country) },
  });

  const openRegister = () => {
    reset({ ...emptyForm, country: countryNameFor(config.country) });
    setRegisterOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["admin-clients", page, pageSize],
    queryFn: () => adminGetClients(page + 1, pageSize),
    enabled: !debouncedSearch,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["admin-clients-search", debouncedSearch],
    queryFn: () => adminSearchClients(debouncedSearch),
    enabled: !!debouncedSearch,
  });

  const registerMutation = useMutation({
    mutationFn: adminRegisterClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setRegisterOpen(false);
      reset({ ...emptyForm, country: countryNameFor(config.country) });
      showSuccess(t("admin.clientCreated"));
    },
    onError: (err: unknown) => showError(getErrorMessage(err, t("admin.clientCreateError"))),
  });

  const columns: Column<Client>[] = [
    {
      id: "lastName",
      label: t("common.name"),
      minWidth: 150,
      render: (row) => (
        <Typography
          variant="body2"
          sx={{ cursor: "pointer", color: "primary.main", fontWeight: 500 }}
          onClick={() => navigate(`/admin/clients/${row.id}`)}
        >
          {row.lastName}, {row.firstName}
        </Typography>
      ),
    },
    { id: "dni", label: config.nationalIdLabel, minWidth: 100 },
    { id: "email", label: "Email", minWidth: 180 },
    { id: "phone", label: t("registration.phone"), minWidth: 120 },
    {
      id: "city",
      label: t("registration.city"),
      render: (row) => `${row.city}, ${row.province}`,
    },
    {
      id: "isBlocked",
      label: t("common.status"),
      render: (row) => <StatusBadge status={row.isBlocked ? "blocked" : "active"} />,
    },
    {
      id: "createdAt",
      label: t("admin.registrationDate"),
      render: (row) => format(new Date(row.createdAt), "dd/MM/yyyy"),
    },
  ];

  const rows = debouncedSearch ? (searchResults || []) : (clientsData?.data || []);
  const loading = debouncedSearch ? searchLoading : isLoading;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t("nav.clients")}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openRegister}>
          {t("admin.registerClient")}
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder={t("admin.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      <DataTable
        columns={columns}
        rows={rows}
        total={debouncedSearch ? rows.length : (clientsData?.total || 0)}
        page={page}
        pageSize={pageSize}
        onPageChange={debouncedSearch ? undefined : setPage}
        onPageSizeChange={debouncedSearch ? undefined : (size) => { setPageSize(size); setPage(0); }}
        loading={loading}
        keyExtractor={(row) => row.id}
        emptyMessage={t("admin.noClientsFound")}
      />

      {/* Register Client Dialog */}
      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("admin.registerClient")}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Controller name="email" control={control} render={({ field }) => (
              <TextField {...field} type="email" label={t("auth.email")}
                error={!!errors.email} helperText={errors.email ? t("validation.invalidEmail") : undefined} />
            )} />
            <Box display="flex" gap={2}>
              <Controller name="firstName" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label={t("registration.firstName")}
                  error={!!errors.firstName} helperText={errors.firstName ? t("validation.required") : undefined} />
              )} />
              <Controller name="lastName" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label={t("registration.lastName")}
                  error={!!errors.lastName} helperText={errors.lastName ? t("validation.required") : undefined} />
              )} />
            </Box>
            <Box display="flex" gap={2}>
              <Controller name="dni" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label={config.nationalIdLabel}
                  error={!!errors.dni} helperText={errors.dni ? t("validation.invalidDni") : undefined} />
              )} />
              <Controller name="cuit" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label={config.taxIdLabel}
                  error={!!errors.cuit} helperText={errors.cuit ? t("validation.invalidCuit") : undefined} />
              )} />
            </Box>
            <Controller name="dateOfBirth" control={control} render={({ field }) => (
              <TextField {...field} type="date" label={t("registration.dateOfBirth")} InputLabelProps={{ shrink: true }}
                error={!!errors.dateOfBirth} helperText={errors.dateOfBirth ? t("validation.required") : undefined} />
            )} />
            <Controller name="phone" control={control} render={({ field }) => (
              <TextField {...field} label={t("registration.phone")}
                error={!!errors.phone} helperText={errors.phone ? t("validation.invalidPhone") : undefined} />
            )} />
            <Controller name="address" control={control} render={({ field }) => (
              <TextField {...field} label={t("registration.address")}
                error={!!errors.address} helperText={errors.address ? t("validation.required") : undefined} />
            )} />
            <Grid container spacing={2}>
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
            {(errors.country || errors.province || errors.city) && (
              <FormHelperText error>{t("validation.locationRequired")}</FormHelperText>
            )}
            <Controller name="isPEP" control={control} render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label={t("registration.isPEP")}
              />
            )} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegisterOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSubmit((data) => registerMutation.mutate(data))}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientList;
