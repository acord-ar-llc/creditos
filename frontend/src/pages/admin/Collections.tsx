import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Chip, Link } from "@mui/material";
import { format } from "date-fns";
import { adminGetOverdueInstallments } from "../../api/endpoints";
import DataTable, { Column } from "../../components/DataTable";
import MoneyDisplay from "../../components/MoneyDisplay";
import type { OverdueInstallment } from "../../api/types";

const Collections: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-collections", page, pageSize],
    queryFn: () => adminGetOverdueInstallments(page + 1, pageSize),
  });

  const severityColor = (days: number): "warning" | "error" => (days >= 60 ? "error" : "warning");

  const columns: Column<OverdueInstallment>[] = [
    {
      id: "clientName",
      label: t("collections.client"),
      minWidth: 180,
      render: (row) => (
        <Link
          component="button"
          underline="hover"
          onClick={() => navigate(`/admin/clients/${row.clientId}`)}
        >
          {row.clientName}
        </Link>
      ),
    },
    {
      id: "number",
      label: t("collections.installment"),
      minWidth: 90,
      render: (row) => `#${row.number}`,
    },
    {
      id: "dueDate",
      label: t("collections.dueDate"),
      minWidth: 120,
      render: (row) => format(new Date(row.dueDate), "dd/MM/yyyy"),
    },
    {
      id: "daysOverdue",
      label: t("collections.daysOverdue"),
      minWidth: 120,
      render: (row) => (
        <Chip label={row.daysOverdue} size="small" color={severityColor(row.daysOverdue)} />
      ),
    },
    {
      id: "remainingAmount",
      label: t("collections.amountDue"),
      minWidth: 140,
      render: (row) => <MoneyDisplay amount={row.remainingAmount} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t("collections.title")}</Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {t("collections.subtitle")}
      </Typography>

      <DataTable
        columns={columns}
        rows={data?.data || []}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        loading={isLoading}
        keyExtractor={(row) => row.installmentId}
        emptyMessage={t("collections.noOverdue")}
      />
    </Box>
  );
};

export default Collections;
