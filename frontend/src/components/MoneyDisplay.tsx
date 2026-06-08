import React from "react";
import { Typography } from "@mui/material";
import { formatMoney } from "../config/countryConfig";

interface MoneyDisplayProps {
  amount: number | string;
  variant?: "body1" | "body2" | "h4" | "h5" | "h6" | "subtitle1" | "subtitle2";
  color?: string;
  fontWeight?: number;
}

const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  variant = "body1",
  color,
  fontWeight,
}) => {
  const formatted = formatMoney(amount);

  return (
    <Typography variant={variant} color={color} fontWeight={fontWeight} component="span">
      {formatted}
    </Typography>
  );
};

export default MoneyDisplay;
