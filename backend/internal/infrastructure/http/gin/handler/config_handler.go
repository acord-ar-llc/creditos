package handler

import (
	"net/http"

	"github.com/diogenes-moreira/creditos/backend/internal/infrastructure/config"
	"github.com/gin-gonic/gin"
)

// ConfigHandler exposes the deployment-country localization metadata.
type ConfigHandler struct {
	info config.CountryInfo
}

func NewConfigHandler(info config.CountryInfo) *ConfigHandler {
	return &ConfigHandler{info: info}
}

// GetConfig returns the public deployment configuration (country, currency,
// locale and identity labels) consumed by the frontend at bootstrap.
// @Summary Get deployment configuration
// @Description Returns the country, currency, locale and identity labels for this deployment
// @Tags Config
// @Produce json
// @Success 200 {object} config.CountryInfo
// @Router /config [get]
func (h *ConfigHandler) GetConfig(c *gin.Context) {
	c.JSON(http.StatusOK, h.info)
}
