package config

import (
	"os"
	"strconv"
)

type Config struct {
	DB              DBConfig
	Server          ServerConfig
	JWT             JWTConfig
	GCS             GCSConfig
	Country         string
	DefaultIVARate  float64
	LatePenaltyRate float64
}

// CountryInfo holds the deployment-country localization metadata that the
// frontend consumes via the public /config endpoint.
type CountryInfo struct {
	Country         string  `json:"country"`
	Currency        string  `json:"currency"`
	Locale          string  `json:"locale"`
	NationalIDLabel string  `json:"nationalIdLabel"`
	TaxIDLabel      string  `json:"taxIdLabel"`
	IVARate         float64 `json:"ivaRate"`
}

// countryDefaults maps a country code to its localization defaults.
var countryDefaults = map[string]struct {
	Currency        string
	Locale          string
	TimeZone        string
	NationalIDLabel string
	TaxIDLabel      string
	IVARate         float64
}{
	"AR": {Currency: "ARS", Locale: "es-AR", TimeZone: "America/Argentina/Buenos_Aires", NationalIDLabel: "DNI", TaxIDLabel: "CUIT", IVARate: 21},
	"CO": {Currency: "COP", Locale: "es-CO", TimeZone: "America/Bogota", NationalIDLabel: "Cédula", TaxIDLabel: "NIT", IVARate: 19},
}

// CountryInfo returns the localization metadata for the configured country.
func (c *Config) CountryInfo() CountryInfo {
	d := countryDefaults[c.Country]
	return CountryInfo{
		Country:         c.Country,
		Currency:        d.Currency,
		Locale:          d.Locale,
		NationalIDLabel: d.NationalIDLabel,
		TaxIDLabel:      d.TaxIDLabel,
		IVARate:         c.DefaultIVARate,
	}
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
	Instance string
	TimeZone string
}

func (c DBConfig) DSN() string {
	sslMode := c.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}
	tz := c.TimeZone
	if tz == "" {
		tz = "America/Argentina/Buenos_Aires"
	}
	dsn := "host=" + c.Host +
		" user=" + c.User +
		" password=" + c.Password +
		" dbname=" + c.Name +
		" port=" + c.Port +
		" sslmode=" + sslMode +
		" TimeZone=" + tz
	return dsn
}

type ServerConfig struct {
	Port string
	Mode string
}

type JWTConfig struct {
	Secret          string
	ExpirationHours int
}

type GCSConfig struct {
	Bucket          string
	CredentialsFile string
	LocalPath       string
}

func Load() *Config {
	country := getEnv("COUNTRY", "AR")
	defaults, ok := countryDefaults[country]
	if !ok {
		// Unknown country falls back to Argentina defaults.
		country = "AR"
		defaults = countryDefaults["AR"]
	}

	return &Config{
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "creditos"),
			Password: getEnv("DB_PASSWORD", "creditos_secret"),
			Name:     getEnv("DB_NAME", "creditos"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			Instance: getEnv("DB_INSTANCE", ""),
			TimeZone: defaults.TimeZone,
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		JWT: JWTConfig{
			Secret:          getEnv("JWT_SECRET", "change-me-in-production"),
			ExpirationHours: getEnvInt("JWT_EXPIRATION_HOURS", 24),
		},
		GCS: GCSConfig{
			Bucket:          getEnv("GCS_BUCKET", ""),
			CredentialsFile: getEnv("GCS_CREDENTIALS_FILE", ""),
			LocalPath:       getEnv("LOCAL_STORAGE_PATH", "./storage"),
		},
		Country:         country,
		DefaultIVARate:  getEnvFloat("DEFAULT_IVA_RATE", defaults.IVARate),
		LatePenaltyRate: getEnvFloat("LATE_PENALTY_RATE", 10),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}
