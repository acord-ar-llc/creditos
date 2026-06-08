package model

import (
	"fmt"
	"time"

	"github.com/diogenes-moreira/creditos/backend/pkg/validator"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type Client struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey"`
	UserID          uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null"`
	User            User           `gorm:"foreignKey:UserID"`
	FirstName       string         `gorm:"not null"`
	LastName        string         `gorm:"not null"`
	DNI             string         `gorm:"column:dni;uniqueIndex;not null"`
	CUIT            string         `gorm:"column:cuit;uniqueIndex;not null"`
	DateOfBirth     time.Time      `gorm:"not null"`
	Phone           string         `gorm:"not null"`
	Address         string         `gorm:"not null"`
	City            string         `gorm:"not null"`
	Province        string         `gorm:"not null"`
	Country         string         `gorm:"not null;default:'Argentina'"`
	Comments        string         `gorm:"type:text"`
	IsPEP           bool            `gorm:"not null;default:false"`
	IVARate         decimal.Decimal `gorm:"type:decimal(5,2);not null;default:21.00"`
	MercadoPagoLink string          `gorm:""`
	IsBlocked       bool            `gorm:"not null;default:false"`
	CreatedAt       time.Time      `gorm:"not null"`
	UpdatedAt       time.Time      `gorm:"not null"`
	DeletedAt       gorm.DeletedAt `gorm:"index"`
}

// NewClient creates a client, validating the national ID (dni) and tax ID (cuit)
// according to the deployment country (idCountry: "AR" uses DNI/CUIT, "CO" uses Cédula/NIT).
func NewClient(userID uuid.UUID, firstName, lastName, dni, cuit string, dob time.Time, phone, address, city, province, country string, isPEP bool, idCountry string) (*Client, error) {
	if firstName == "" || lastName == "" {
		return nil, fmt.Errorf("first name and last name are required")
	}

	if err := validator.ValidateNationalID(dni, idCountry); err != nil {
		return nil, fmt.Errorf("invalid national ID: %w", err)
	}

	if err := validator.ValidateTaxID(cuit, idCountry); err != nil {
		return nil, fmt.Errorf("invalid tax ID: %w", err)
	}

	if err := validateAge(dob); err != nil {
		return nil, err
	}

	if phone == "" {
		return nil, fmt.Errorf("phone is required")
	}

	return &Client{
		ID:          uuid.New(),
		UserID:      userID,
		FirstName:   firstName,
		LastName:    lastName,
		DNI:         dni,
		CUIT:        cuit,
		DateOfBirth: dob,
		Phone:       phone,
		Address:     address,
		City:        city,
		Province:    province,
		Country:     country,
		IsPEP:       isPEP,
	}, nil
}

func validateAge(dob time.Time) error {
	age := time.Now().Year() - dob.Year()
	if time.Now().YearDay() < dob.YearDay() {
		age--
	}
	if age < 18 {
		return fmt.Errorf("client must be at least 18 years old, got %d", age)
	}
	if age > 120 {
		return fmt.Errorf("invalid date of birth")
	}
	return nil
}

func (c *Client) FullName() string {
	return c.FirstName + " " + c.LastName
}

func (c *Client) Block() {
	c.IsBlocked = true
}

func (c *Client) Unblock() {
	c.IsBlocked = false
}

func (c *Client) SetMercadoPagoLink(link string) {
	c.MercadoPagoLink = link
}

func (c *Client) SetIVARate(rate decimal.Decimal) {
	c.IVARate = rate
}

func (c *Client) UpdateProfile(phone, address, city, province, country string) {
	if phone != "" {
		c.Phone = phone
	}
	if address != "" {
		c.Address = address
	}
	if city != "" {
		c.City = city
	}
	if province != "" {
		c.Province = province
	}
	if country != "" {
		c.Country = country
	}
}

func (c *Client) SetComments(comments string) {
	c.Comments = comments
}

// AdminUpdate updates all editable client fields (admin only).
func (c *Client) AdminUpdate(firstName, lastName, dni, cuit, phone, address, city, province, country string, isPEP bool) {
	if firstName != "" {
		c.FirstName = firstName
	}
	if lastName != "" {
		c.LastName = lastName
	}
	if dni != "" {
		c.DNI = dni
	}
	if cuit != "" {
		c.CUIT = cuit
	}
	if phone != "" {
		c.Phone = phone
	}
	if address != "" {
		c.Address = address
	}
	if city != "" {
		c.City = city
	}
	if province != "" {
		c.Province = province
	}
	if country != "" {
		c.Country = country
	}
	c.IsPEP = isPEP
}
