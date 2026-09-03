package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/model"
	"github.com/diogenes-moreira/creditos/backend/internal/infrastructure/config"
	"github.com/diogenes-moreira/creditos/backend/internal/infrastructure/persistence/postgres"
	"github.com/diogenes-moreira/creditos/backend/pkg/validator"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

const (
	sectionAll     = "all"
	sectionVendors = "vendors"
	sectionAdmin   = "admin"
)

// only selects which part of the dataset to seed. The default seeds everything,
// which is what a fresh environment needs. "vendors" seeds just the vendor module
// on top of clients and credit lines that already exist, so an environment that is
// only missing that module can be completed without duplicating its portfolio.
var only = flag.String("only", sectionAll, "section to seed: all|vendors|admin")

// adminEmail is the account granted administrator access by -only=admin. It exists
// so a person can be given access to an environment without hand-editing the
// database: Google sign-in is restricted to admins, and FirebaseLogin links the
// Firebase UID to this row by email on the first successful sign-in.
var adminEmail = flag.String("email", "", "email to grant admin access to (required by -only=admin)")

func main() {
	flag.Parse()
	_ = godotenv.Load()
	cfg := config.Load()
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
		log.Fatalf("Failed to migrate: %v", err)
	}

	log.Printf("Seeding database for country %s (section: %s)...", cfg.Country, *only)
	switch *only {
	case sectionAll:
		seedAdmins(db, cfg.Country)
		clients := seedClients(db, 50, cfg.Country)
		creditLines := seedCreditLines(db, clients, 30)
		loans := seedLoans(db, clients, creditLines, 40, cfg.DefaultIVARate)
		seedPayments(db, loans)
		seedVendors(db, 5, cfg.Country, cfg.DefaultIVARate)
	case sectionVendors:
		seedVendors(db, 5, cfg.Country, cfg.DefaultIVARate)
	case sectionAdmin:
		grantAdmin(db, *adminEmail)
	default:
		log.Fatalf("unknown -only value %q (expected %s, %s or %s)", *only, sectionAll, sectionVendors, sectionAdmin)
	}
	log.Println("Seed completed successfully!")
}

func seedAdmins(db *gorm.DB, country string) {
	tld := "com.ar"
	phonePrefix := "+5491140510"
	if country == "CO" {
		tld = "com.co"
		phonePrefix = "+5713000010"
	}
	admins := []struct{ email, name, phone string }{
		{fmt.Sprintf("admin@prestia.%s", tld), "Admin Principal", phonePrefix + "100"},
		{fmt.Sprintf("supervisor@prestia.%s", tld), "Supervisor", phonePrefix + "101"},
	}
	for _, a := range admins {
		var existing model.User
		if err := db.Where("email = ?", a.email).First(&existing).Error; err == nil {
			// User exists — ensure admin role and active
			existing.Role = model.RoleAdmin
			existing.IsActive = true
			existing.Phone = a.phone
			if err := db.Save(&existing).Error; err != nil {
				log.Printf("Admin update %s: %v", a.email, err)
			} else {
				log.Printf("Admin updated: %s (ID: %s, role: %s)", a.email, existing.ID, existing.Role)
			}
		} else {
			user := &model.User{
				ID:          uuid.New(),
				FirebaseUID: uuid.New().String(),
				Email:       a.email,
				Phone:       a.phone,
				Role:        model.RoleAdmin,
				IsActive:    true,
			}
			if err := db.Create(user).Error; err != nil {
				log.Printf("Admin create %s: %v", a.email, err)
			} else {
				log.Printf("Admin created: %s (ID: %s)", a.email, user.ID)
			}
		}
	}
}

type countryDataset struct {
	countryName   string
	phonePrefix   string
	firstNames    []string
	lastNames     []string
	provinces     []string
	cities        []string
	businessNames []string
}

var datasets = map[string]countryDataset{
	"AR": {
		countryName:   "Argentina",
		phonePrefix:   "+5411",
		firstNames:    []string{"Juan", "María", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofía", "Diego", "Valentina", "Martín", "Camila", "Jorge", "Lucía", "Fernando", "Paula", "Ricardo", "Florencia", "Alejandro", "Julieta", "Roberto", "Daniela", "Sebastián", "Agustina", "Gabriel", "Antonella"},
		lastNames:     []string{"González", "Rodríguez", "López", "Martínez", "García", "Fernández", "Pérez", "Sánchez", "Romero", "Torres", "Díaz", "Álvarez", "Ruiz", "Ramírez", "Flores", "Acosta", "Medina", "Herrera", "Suárez", "Castro", "Morales", "Ortiz", "Gutiérrez", "Silva", "Rojas", "Vega"},
		provinces:     []string{"Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes"},
		cities:        []string{"Villanueva", "San Fernando", "Moreno", "Merlo", "Quilmes", "La Plata", "Tigre", "Pilar", "Campana", "Zárate"},
		businessNames: []string{"Electrodomésticos San Martín", "Muebles del Litoral", "Tecno Hogar Villanueva", "Indumentaria La Estrella", "Motos y Repuestos Quilmes", "Bazar Don Pedro", "Colchones y Sommiers Sur"},
	},
	"CO": {
		countryName:   "Colombia",
		phonePrefix:   "+57300",
		firstNames:    []string{"Santiago", "Sofía", "Mateo", "Isabella", "Sebastián", "Valentina", "Andrés", "Camila", "Juan", "Mariana", "Carlos", "Daniela", "Felipe", "Valeria", "David", "Sara", "Nicolás", "Laura", "Samuel", "Gabriela", "Esteban", "Manuela", "Tomás", "Antonia", "Emanuel", "Salomé"},
		lastNames:     []string{"Rodríguez", "Gómez", "González", "Martínez", "García", "López", "Hernández", "Ramírez", "Muñoz", "Rojas", "Moreno", "Jiménez", "Gutiérrez", "Vargas", "Castro", "Ortiz", "Ramos", "Suárez", "Rincón", "Cardona", "Cardenas", "Quintero", "Pineda", "Mejía", "Restrepo", "Ospina"},
		provinces:     []string{"Cundinamarca", "Antioquia", "Valle del Cauca", "Atlántico", "Santander", "Bolívar", "Caldas", "Risaralda", "Tolima", "Boyacá"},
		cities:        []string{"Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Cartagena", "Manizales", "Pereira", "Ibagué", "Tunja"},
		businessNames: []string{"Electrodomésticos El Dorado", "Muebles Antioquia", "Tecno Hogar Chapinero", "Almacén La Estrella", "Motos y Repuestos Cali", "Bazar Don Pedro", "Colchones y Espumas Andes"},
	},
}

// genIdentity returns a (nationalID, taxID) pair valid for the given country.
func genIdentity(country string) (string, string) {
	if country == "CO" {
		cedula := fmt.Sprintf("%d", 1000000000+rand.Intn(100000000))
		base := fmt.Sprintf("%09d", 800000000+rand.Intn(199999999))
		dv := validator.CalculateNITCheckDigit(base)
		return cedula, fmt.Sprintf("%s%d", base, dv)
	}
	dniNum := 20000000 + rand.Intn(30000000)
	prefix := "20"
	if rand.Intn(2) == 0 {
		prefix = "27"
	}
	cuitBase := prefix + fmt.Sprintf("%08d", dniNum)
	return fmt.Sprintf("%d", dniNum), fmt.Sprintf("%s%d", cuitBase, calculateCUITCheckDigit(cuitBase))
}

func seedClients(db *gorm.DB, count int, country string) []model.Client {
	ds, ok := datasets[country]
	if !ok {
		ds = datasets["AR"]
	}
	var clients []model.Client
	for i := 0; i < count; i++ {
		fn := ds.firstNames[rand.Intn(len(ds.firstNames))]
		ln := ds.lastNames[rand.Intn(len(ds.lastNames))]
		email := fmt.Sprintf("%s.%s.%d@email.com", fn, ln, i)

		phoneNum := fmt.Sprintf("%s%d", ds.phonePrefix, 4000000+rand.Intn(2000000))
		user := &model.User{
			ID:          uuid.New(),
			FirebaseUID: uuid.New().String(),
			Email:       email,
			Phone:       phoneNum,
			Role:        model.RoleClient,
			IsActive:    true,
		}
		db.Create(user)

		dniStr, cuit := genIdentity(country)

		age := 22 + rand.Intn(40)
		dob := time.Now().AddDate(-age, -rand.Intn(12), -rand.Intn(28))

		client := model.Client{
			ID:          uuid.New(),
			UserID:      user.ID,
			FirstName:   fn,
			LastName:    ln,
			DNI:         dniStr,
			CUIT:        cuit,
			DateOfBirth: dob,
			Phone:       phoneNum,
			Address:     fmt.Sprintf("Calle %d #%d", rand.Intn(200)+1, rand.Intn(5000)+100),
			City:        ds.cities[rand.Intn(len(ds.cities))],
			Province:    ds.provinces[rand.Intn(len(ds.provinces))],
			Country:     ds.countryName,
			IsPEP:       rand.Intn(20) == 0,
		}
		db.Create(&client)

		account := model.CurrentAccount{
			ID:       uuid.New(),
			ClientID: client.ID,
			Balance:  decimal.NewFromInt(0),
		}
		db.Create(&account)

		clients = append(clients, client)
		if (i+1)%10 == 0 {
			log.Printf("Created %d/%d clients", i+1, count)
		}
	}
	return clients
}

func calculateCUITCheckDigit(base string) int {
	weights := []int{5, 4, 3, 2, 7, 6, 5, 4, 3, 2}
	sum := 0
	for i, w := range weights {
		d := int(base[i] - '0')
		sum += d * w
	}
	remainder := sum % 11
	switch remainder {
	case 0:
		return 0
	case 1:
		return 9
	default:
		return 11 - remainder
	}
}

func seedCreditLines(db *gorm.DB, clients []model.Client, count int) []model.CreditLine {
	var cls []model.CreditLine
	adminID := uuid.New()
	amounts := []int64{50000, 100000, 200000, 500000, 1000000}
	rates := []string{"0.35", "0.40", "0.45", "0.50", "0.55"}

	for i := 0; i < count && i < len(clients); i++ {
		amount := decimal.NewFromInt(amounts[rand.Intn(len(amounts))])
		rate, _ := decimal.NewFromString(rates[rand.Intn(len(rates))])
		maxInst := []int{6, 12, 18, 24, 36}[rand.Intn(5)]

		cl := model.CreditLine{
			ID:              uuid.New(),
			ClientID:        clients[i].ID,
			MaxAmount:       amount,
			UsedAmount:      decimal.NewFromInt(0),
			InterestRate:    rate,
			MaxInstallments: maxInst,
			Status:          model.CreditLinePending,
		}

		// Approve most
		if rand.Intn(5) != 0 {
			cl.Status = model.CreditLineApproved
			cl.ApprovedBy = &adminID
			now := time.Now().AddDate(0, -rand.Intn(6), -rand.Intn(28))
			cl.ApprovedAt = &now
		}

		db.Create(&cl)
		cls = append(cls, cl)
	}
	log.Printf("Created %d credit lines", len(cls))
	return cls
}

func seedLoans(db *gorm.DB, clients []model.Client, cls []model.CreditLine, count int, defaultIVARate float64) []model.Loan {
	var loans []model.Loan
	adminID := uuid.New()

	approvedCLs := make([]model.CreditLine, 0)
	for _, cl := range cls {
		if cl.Status == model.CreditLineApproved {
			approvedCLs = append(approvedCLs, cl)
		}
	}

	for i := 0; i < count && i < len(approvedCLs); i++ {
		cl := approvedCLs[i]
		principal := cl.MaxAmount.Mul(decimal.NewFromFloat(0.3 + rand.Float64()*0.7)).Round(2)
		numInst := []int{3, 6, 12}[rand.Intn(3)]
		if numInst > cl.MaxInstallments {
			numInst = cl.MaxInstallments
		}
		amortType := model.AmortizationFrench
		if rand.Intn(3) == 0 {
			amortType = model.AmortizationGerman
		}

		disbursedMonthsAgo := rand.Intn(12) + 1
		startDate := time.Now().AddDate(0, -disbursedMonthsAgo, 0)

		loan := model.Loan{
			ID:               uuid.New(),
			ClientID:         cl.ClientID,
			CreditLineID:     cl.ID,
			Principal:        principal,
			InterestRate:     cl.InterestRate,
			NumInstallments:  numInst,
			AmortizationType: amortType,
			Status:           model.LoanActive,
			DisbursedAt:      &startDate,
			ApprovedBy:       &adminID,
			ApprovedAt:       &startDate,
		}

		// Generate installments
		defaultIVARate := decimal.NewFromFloat(defaultIVARate)
		var schedule model.AmortizationSchedule
		if amortType == model.AmortizationFrench {
			schedule = model.CalculateFrenchAmortization(principal, cl.InterestRate, numInst, startDate, defaultIVARate)
		} else {
			schedule = model.CalculateGermanAmortization(principal, cl.InterestRate, numInst, startDate, defaultIVARate)
		}

		var installments []model.Installment
		allPaid := true
		for _, calc := range schedule.Installments {
			inst := model.Installment{
				ID:              uuid.New(),
				LoanID:          loan.ID,
				Number:          calc.Number,
				DueDate:         calc.DueDate,
				CapitalAmount:   calc.Capital,
				InterestAmount:  calc.Interest,
				IVAAmount:       calc.IVA,
				TotalAmount:     calc.Total,
				PaidAmount:      decimal.NewFromInt(0),
				RemainingAmount: calc.Total,
				Status:          model.InstallmentPending,
			}

			// Pay installments that are past due (with some missed for delinquency)
			if calc.DueDate.Before(time.Now()) {
				if rand.Intn(5) != 0 { // 80% paid on time
					inst.PaidAmount = inst.TotalAmount
					inst.RemainingAmount = decimal.NewFromInt(0)
					inst.Status = model.InstallmentPaid
					paidAt := calc.DueDate.Add(time.Duration(rand.Intn(5)) * 24 * time.Hour)
					inst.PaidAt = &paidAt
				} else {
					inst.Status = model.InstallmentOverdue
					allPaid = false
				}
			} else {
				allPaid = false
			}
			installments = append(installments, inst)
		}

		if allPaid {
			loan.Status = model.LoanCompleted
			now := time.Now()
			loan.CompletedAt = &now
		}

		// Some loans in other states
		switch rand.Intn(10) {
		case 8:
			if !allPaid {
				loan.Status = model.LoanDefaulted
			}
		case 9:
			loan.Status = model.LoanCancelled
			now := time.Now()
			loan.CancelledAt = &now
		}

		db.Create(&loan)
		for _, inst := range installments {
			db.Create(&inst)
		}

		// Update credit line used amount
		cl.UsedAmount = cl.UsedAmount.Add(principal)
		db.Save(&cl)

		// Create payments for paid installments
		for _, inst := range installments {
			if inst.Status == model.InstallmentPaid {
				methods := []model.PaymentMethod{model.PaymentCash, model.PaymentTransfer, model.PaymentMercadoPago}
				payment := model.Payment{
					ID:        uuid.New(),
					LoanID:    loan.ID,
					Amount:    inst.TotalAmount,
					Method:    methods[rand.Intn(len(methods))],
					CreatedAt: *inst.PaidAt,
					UpdatedAt: *inst.PaidAt,
				}
				db.Create(&payment)
			}
		}

		// Credit account on disbursement
		var account model.CurrentAccount
		if db.Where("client_id = ?", cl.ClientID).First(&account).Error == nil {
			account.Balance = account.Balance.Add(principal)
			db.Save(&account)

			movement := model.Movement{
				ID:           uuid.New(),
				AccountID:    account.ID,
				Type:         model.MovementTypeCredit,
				Amount:       principal,
				BalanceAfter: account.Balance,
				Description:  "Loan disbursement",
				Reference:    loan.ID.String(),
				CreatedAt:    startDate,
			}
			db.Create(&movement)
		}

		loans = append(loans, loan)
		if (i+1)%10 == 0 {
			log.Printf("Created %d/%d loans", i+1, count)
		}
	}
	log.Printf("Created %d loans total", len(loans))
	return loans
}

func seedPayments(db *gorm.DB, loans []model.Loan) {
	// Audit log entries
	actions := []string{"register", "login", "create_credit_line", "approve_credit_line", "request_loan", "approve_loan", "disburse_loan", "record_payment"}
	for i := 0; i < 100; i++ {
		log := model.AuditLog{
			ID:          uuid.New(),
			Action:      actions[rand.Intn(len(actions))],
			EntityType:  "system",
			EntityID:    uuid.New().String(),
			Description: fmt.Sprintf("Seed audit log entry %d", i),
			IP:          fmt.Sprintf("192.168.1.%d", rand.Intn(255)),
			UserAgent:   "Seed/1.0",
			CreatedAt:   time.Now().AddDate(0, 0, -rand.Intn(90)),
		}
		db.Create(&log)
	}
	fmt.Println("Created 100 audit log entries")
}

// seedVendors creates vendor businesses, each with its current account and a few
// credit-financed purchases, so the vendor module has something to show.
//
// Unlike the other seed sections it does not create clients or credit lines: it
// draws on the approved credit lines already stored, which lets it complete an
// environment whose portfolio is already populated without duplicating it.
func seedVendors(db *gorm.DB, count int, country string, defaultIVARate float64) {
	ds, ok := datasets[country]
	if !ok {
		ds = datasets["AR"]
	}

	// Only approved credit lines can finance a purchase.
	var creditLines []model.CreditLine
	if err := db.Where("status = ?", model.CreditLineApproved).Find(&creditLines).Error; err != nil {
		log.Printf("Vendors: failed to load credit lines: %v", err)
		return
	}
	if len(creditLines) == 0 {
		log.Println("Vendors: no approved credit lines available — skipping purchases")
	}

	adminID := uuid.New()
	clIdx := 0
	created := 0

	for i := 0; i < count && i < len(ds.businessNames); i++ {
		businessName := ds.businessNames[i]
		_, taxID := genIdentity(country)
		city := ds.cities[rand.Intn(len(ds.cities))]
		province := ds.provinces[rand.Intn(len(ds.provinces))]
		email := vendorEmail(businessName, country)

		var existing model.User
		if db.Where("email = ?", email).First(&existing).Error == nil {
			log.Printf("Vendor already exists, skipping: %s", email)
			continue
		}

		user, err := model.NewUser(uuid.New().String(), email, model.RoleVendor)
		if err != nil {
			log.Printf("Vendor user %s: %v", email, err)
			continue
		}
		user.Phone = fmt.Sprintf("%s%07d", ds.phonePrefix, rand.Intn(10000000))
		if err := db.Create(user).Error; err != nil {
			log.Printf("Vendor user create %s: %v", email, err)
			continue
		}

		vendor, err := model.NewVendor(user.ID, businessName, taxID, user.Phone,
			fmt.Sprintf("Av. %s %d", ds.lastNames[rand.Intn(len(ds.lastNames))], 100+rand.Intn(4900)),
			city, province, ds.countryName, country)
		if err != nil {
			log.Printf("Vendor %s: %v", businessName, err)
			continue
		}
		if err := db.Create(vendor).Error; err != nil {
			log.Printf("Vendor create %s: %v", businessName, err)
			continue
		}

		account := model.NewVendorAccount(vendor.ID)
		if err := db.Create(account).Error; err != nil {
			log.Printf("Vendor account %s: %v", businessName, err)
			continue
		}

		// Two to four purchases per vendor, each financed by its own loan.
		numPurchases := 2 + rand.Intn(3)
		for p := 0; p < numPurchases && len(creditLines) > 0; p++ {
			cl := &creditLines[clIdx%len(creditLines)]
			clIdx++
			if seedPurchase(db, vendor, account, cl, adminID, defaultIVARate) {
				created++
			}
		}

		log.Printf("Vendor created: %s (%s, balance %s)", businessName, email, account.Balance.StringFixed(2))
	}

	log.Printf("Created %d vendor purchases", created)
}

// seedPurchase records one credit-financed purchase against a credit line,
// following the same domain flow as PurchaseService: the loan is requested,
// approved and disbursed, and the sale is credited to the vendor's account.
// It reports whether the purchase was recorded.
func seedPurchase(db *gorm.DB, vendor *model.Vendor, account *model.VendorAccount, cl *model.CreditLine, adminID uuid.UUID, defaultIVARate float64) bool {
	available := cl.AvailableAmount()
	if !available.IsPositive() {
		return false
	}

	// Spend a slice of what is left, so the line keeps some headroom.
	amount := available.Mul(decimal.NewFromFloat(0.15 + rand.Float64()*0.35)).Round(2)
	if err := cl.CanDisburse(amount); err != nil {
		return false
	}

	numInst := []int{3, 6, 12}[rand.Intn(3)]
	if numInst > cl.MaxInstallments {
		numInst = cl.MaxInstallments
	}
	amortType := model.AmortizationFrench
	if rand.Intn(3) == 0 {
		amortType = model.AmortizationGerman
	}

	loan, err := model.NewLoan(cl.ClientID, cl.ID, amount, cl.InterestRate, numInst, amortType)
	if err != nil {
		log.Printf("Purchase loan: %v", err)
		return false
	}
	if err := loan.RequestApproval(); err != nil {
		log.Printf("Purchase loan approval request: %v", err)
		return false
	}
	if err := loan.Approve(adminID); err != nil {
		log.Printf("Purchase loan approve: %v", err)
		return false
	}

	ivaRate := decimal.NewFromFloat(defaultIVARate)
	var client model.Client
	if db.First(&client, "id = ?", cl.ClientID).Error == nil && client.IVARate.IsPositive() {
		ivaRate = client.IVARate
	}

	startDate := time.Now().AddDate(0, -(1 + rand.Intn(8)), 0)
	installments, err := loan.Disburse(startDate, ivaRate)
	if err != nil {
		log.Printf("Purchase loan disburse: %v", err)
		return false
	}
	loan.DisbursedAt = &startDate

	// Settle instalments that already fell due, leaving some unpaid so the
	// delinquency indicators have something to report.
	for i := range installments {
		if !installments[i].DueDate.Before(time.Now()) {
			continue
		}
		if rand.Intn(5) == 0 {
			installments[i].Status = model.InstallmentOverdue
			continue
		}
		installments[i].PaidAmount = installments[i].TotalAmount
		installments[i].RemainingAmount = decimal.NewFromInt(0)
		installments[i].Status = model.InstallmentPaid
		paidAt := installments[i].DueDate.Add(time.Duration(rand.Intn(5)) * 24 * time.Hour)
		installments[i].PaidAt = &paidAt
	}
	if loan.CheckCompletion() {
		_ = loan.Complete()
	}

	// Disburse already attached the schedule to the loan, so GORM persists the
	// instalments together with it.
	if err := db.Create(loan).Error; err != nil {
		log.Printf("Purchase loan create: %v", err)
		return false
	}

	cl.RecordDisbursement(amount)
	if err := db.Save(cl).Error; err != nil {
		log.Printf("Credit line update: %v", err)
	}

	description := purchaseDescriptions[rand.Intn(len(purchaseDescriptions))]
	purchase, err := model.NewPurchase(vendor.ID, cl.ClientID, cl.ID, loan.ID, amount, description)
	if err != nil {
		log.Printf("Purchase: %v", err)
		return false
	}
	purchase.CreatedAt = startDate
	if err := db.Create(purchase).Error; err != nil {
		log.Printf("Purchase create: %v", err)
		return false
	}

	movement, err := account.Credit(amount, fmt.Sprintf("Sale: %s", description), purchase.ID.String())
	if err != nil {
		log.Printf("Vendor account credit: %v", err)
		return false
	}
	movement.CreatedAt = startDate
	if err := db.Save(account).Error; err != nil {
		log.Printf("Vendor account update: %v", err)
		return false
	}
	if err := db.Create(movement).Error; err != nil {
		log.Printf("Vendor movement create: %v", err)
	}

	return true
}

var purchaseDescriptions = []string{
	"Heladera no frost", "Lavarropas automático", "Smart TV 50\"", "Juego de living",
	"Notebook", "Colchón y sommier", "Cocina a gas", "Aire acondicionado split",
	"Bicicleta", "Microondas",
}

// vendorEmail derives a contact address from the business name so seeded vendors
// are recognisable and stable across runs.
func vendorEmail(businessName, country string) string {
	tld := "com.ar"
	if country == "CO" {
		tld = "com.co"
	}
	slug := strings.ToLower(businessName)
	for _, r := range []struct{ from, to string }{
		{"á", "a"}, {"é", "e"}, {"í", "i"}, {"ó", "o"}, {"ú", "u"}, {"ñ", "n"}, {"\"", ""},
	} {
		slug = strings.ReplaceAll(slug, r.from, r.to)
	}
	slug = strings.ReplaceAll(slug, " ", "-")
	return fmt.Sprintf("contacto@%s.%s", slug, tld)
}

// grantAdmin gives an existing or new account administrator access.
//
// It is the supported way to let someone into an environment: Google sign-in is
// restricted to administrators, and FirebaseLogin looks the user up by email and
// links their real Firebase UID on first sign-in, so no credential has to be
// created or shared here. Running it again on the same address is a no-op beyond
// re-asserting the role.
func grantAdmin(db *gorm.DB, email string) {
	if email == "" {
		log.Fatalf("-only=%s requires -email", sectionAdmin)
	}
	if !strings.Contains(email, "@") {
		log.Fatalf("invalid email: %q", email)
	}

	var existing model.User
	if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
		previous := existing.Role
		existing.Role = model.RoleAdmin
		existing.IsActive = true
		if err := db.Save(&existing).Error; err != nil {
			log.Fatalf("failed to grant admin to %s: %v", email, err)
		}
		log.Printf("Admin granted: %s (ID: %s, previous role: %s)", email, existing.ID, previous)
		return
	}

	user, err := model.NewUser(uuid.New().String(), email, model.RoleAdmin)
	if err != nil {
		log.Fatalf("failed to build admin %s: %v", email, err)
	}
	if err := db.Create(user).Error; err != nil {
		log.Fatalf("failed to create admin %s: %v", email, err)
	}
	log.Printf("Admin created: %s (ID: %s)", email, user.ID)
}
