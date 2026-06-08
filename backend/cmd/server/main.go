package main

import (
	"log"

	_ "github.com/diogenes-moreira/creditos/backend/docs"
	"github.com/joho/godotenv"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/model"
	"github.com/diogenes-moreira/creditos/backend/internal/infrastructure/config"
	ginRouter "github.com/diogenes-moreira/creditos/backend/internal/infrastructure/http/gin"
	"github.com/diogenes-moreira/creditos/backend/internal/infrastructure/persistence/postgres"
	"github.com/gin-gonic/gin"
)

// @title Prestia API
// @version 1.0
// @description Microcredit management system API for Argentina
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@prestia.com.ar

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter your bearer token in the format: Bearer {token}
func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	gin.SetMode(cfg.Server.Mode)

	db, err := postgres.NewConnection(cfg.DB)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := postgres.AutoMigrate(db,
		&model.User{},
		&model.Client{},
		&model.CurrentAccount{},
		&model.Movement{},
		&model.CreditLine{},
		&model.Loan{},
		&model.Installment{},
		&model.Payment{},
		&model.AuditLog{},
		&model.Vendor{},
		&model.VendorAccount{},
		&model.VendorMovement{},
		&model.Purchase{},
		&model.VendorPayment{},
		&model.WithdrawalRequest{},
		&model.OTPCode{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	router := ginRouter.NewRouter(db, cfg)

	log.Printf("Starting server on port %s", cfg.Server.Port)
	if err := router.Engine().Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
