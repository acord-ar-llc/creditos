import React, { useMemo, useState, useEffect } from "react";
import { Autocomplete, TextField, Grid, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

const LATAM_CODES = [
  "AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV",
  "GT", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE",
];

interface LocationSelectorProps {
  country: string;
  province: string;
  city: string;
  onChange: (field: "country" | "province" | "city", value: string) => void;
  errors?: { country?: boolean; province?: boolean; city?: boolean };
}

type GeoModule = typeof import("country-state-city");

const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  province,
  city,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();
  const [geo, setGeo] = useState<GeoModule | null>(null);

  useEffect(() => {
    import("country-state-city").then(setGeo);
  }, []);

  const countries = useMemo(
    () => geo ? geo.Country.getAllCountries().filter((c) => LATAM_CODES.includes(c.isoCode)) : [],
    [geo]
  );

  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === country) || null,
    [countries, country]
  );

  const states = useMemo(
    () => (geo && selectedCountry ? geo.State.getStatesOfCountry(selectedCountry.isoCode) : []),
    [geo, selectedCountry]
  );

  const selectedState = useMemo(
    () => states.find((s) => s.name === province) || null,
    [states, province]
  );

  const cityNames = useMemo(
    () =>
      geo && selectedCountry && selectedState
        ? geo.City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map((c) => c.name)
        : [],
    [geo, selectedCountry, selectedState]
  );

  // While the geo dataset loads, keep the three fields on screen as disabled
  // placeholders. Replacing them with a bare spinner hides which fields are still
  // missing and lets the form be submitted without a province or city.
  if (!geo) {
    return (
      <>
        {[t("registration.country"), t("registration.province"), t("registration.city")].map((label) => (
          <Grid item xs={12} sm={4} key={label}>
            <TextField
              fullWidth
              disabled
              label={label}
              value=""
              placeholder={t("validation.loadingLocations")}
              InputProps={{
                endAdornment: <CircularProgress size={16} sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
        ))}
      </>
    );
  }

  return (
    <>
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={countries}
          getOptionLabel={(o) => o.name}
          value={selectedCountry}
          onChange={(_, val) => {
            onChange("country", val?.name || "");
            onChange("province", "");
            onChange("city", "");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("registration.country")}
              error={errors?.country}
              fullWidth
            />
          )}
          isOptionEqualToValue={(opt, val) => opt.isoCode === val.isoCode}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={states}
          getOptionLabel={(o) => o.name}
          value={selectedState}
          onChange={(_, val) => {
            onChange("province", val?.name || "");
            onChange("city", "");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("registration.province")}
              error={errors?.province}
              fullWidth
            />
          )}
          isOptionEqualToValue={(opt, val) => opt.isoCode === val.isoCode}
          disabled={!selectedCountry}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Autocomplete
          freeSolo
          options={cityNames}
          value={city}
          onChange={(_, val) => {
            onChange("city", (val as string) || "");
          }}
          onInputChange={(_, val, reason) => {
            if (reason === "input") {
              onChange("city", val);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("registration.city")}
              error={errors?.city}
              fullWidth
            />
          )}
          disabled={!selectedState}
        />
      </Grid>
    </>
  );
};

export default LocationSelector;
