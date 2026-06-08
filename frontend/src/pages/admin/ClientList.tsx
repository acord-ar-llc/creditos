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
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { adminGetClients, adminSearchClients, adminRegisterClient } from "../../api/endpoints";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { useNotification } from "../../contexts/NotificationContext";
import { getErrorMessage } from "../../api/errorUtils";
import type { Client, RegisterRequest } from "../../api/types";
import LocationSelector from "../../components/LocationSelector";
import { useCountryConfig, countryNameFor } from "../../config/countryConfig";

const emptyForm: RegisterRequest = {
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
  const [formData, setFormData] = useState<RegisterRequest>({ ...emptyForm, country: countryNameFor(config.country) });
  const { showSuccess, showError } = useNotification();

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
      setFormData({ ...emptyForm, country: countryNameFor(config.country) });
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

  const updateField = (field: keyof RegisterRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [field]: e.target.value });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">{t("nav.clients")}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)}>
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
            <TextField label={t("auth.email")} type="email" value={formData.email} onChange={updateField("email")} />
            <Box display="flex" gap={2}>
              <TextField label={t("registration.firstName")} value={formData.firstName} onChange={updateField("firstName")} fullWidth />
              <TextField label={t("registration.lastName")} value={formData.lastName} onChange={updateField("lastName")} fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label={config.nationalIdLabel} value={formData.dni} onChange={updateField("dni")} fullWidth />
              <TextField label={config.taxIdLabel} value={formData.cuit} onChange={updateField("cuit")} fullWidth />
            </Box>
            <TextField label={t("registration.dateOfBirth")} type="date" value={formData.dateOfBirth} onChange={updateField("dateOfBirth")} InputLabelProps={{ shrink: true }} />
            <TextField label={t("registration.phone")} value={formData.phone} onChange={updateField("phone")} />
            <TextField label={t("registration.address")} value={formData.address} onChange={updateField("address")} />
            <Grid container spacing={2}>
              <LocationSelector
                country={formData.country}
                province={formData.province}
                city={formData.city}
                onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
              />
            </Grid>
            <FormControlLabel
              control={<Checkbox checked={formData.isPEP} onChange={(e) => setFormData({ ...formData, isPEP: e.target.checked })} />}
              label={t("registration.isPEP")}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegisterOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => registerMutation.mutate(formData)}
            disabled={registerMutation.isPending || !formData.email || !formData.firstName || !formData.lastName || !formData.dni || !formData.cuit}
          >
            {registerMutation.isPending ? t("common.creating") : t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientList;
