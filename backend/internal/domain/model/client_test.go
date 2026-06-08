package model_test

import (
	"testing"
	"time"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func validDOB() time.Time {
	return time.Date(1990, 1, 15, 0, 0, 0, 0, time.UTC)
}

func validCUIT() string {
	return "20-12345678-6"
}

func validDNI() string {
	return "12345678"
}

func TestNewClient(t *testing.T) {
	userID := uuid.New()

	tests := []struct {
		name      string
		userID    uuid.UUID
		firstName string
		lastName  string
		dni       string
		cuit      string
		dob       time.Time
		phone     string
		address   string
		city      string
		province  string
		isPEP     bool
		wantErr   bool
		errMsg    string
	}{
		{
			name:      "valid client",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       validDOB(),
			phone:     "+541155551234",
			address:   "Av. Corrientes 1234",
			city:      "Buenos Aires",
			province:  "CABA",
			isPEP:     false,
		},
		{
			name:      "valid PEP client",
			userID:    userID,
			firstName: "Maria",
			lastName:  "Lopez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       validDOB(),
			phone:     "+541155559999",
			address:   "Calle Falsa 123",
			city:      "Rosario",
			province:  "Santa Fe",
			isPEP:     true,
		},
		{
			name:      "empty first name",
			userID:    userID,
			firstName: "",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       validDOB(),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "first name and last name are required",
		},
		{
			name:      "empty last name",
			userID:    userID,
			firstName: "Juan",
			lastName:  "",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       validDOB(),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "first name and last name are required",
		},
		{
			name:      "invalid DNI too short",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       "123",
			cuit:      validCUIT(),
			dob:       validDOB(),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "invalid national ID",
		},
		{
			name:      "invalid CUIT bad check digit",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      "20-12345678-0",
			dob:       validDOB(),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "invalid tax ID",
		},
		{
			name:      "underage client",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       time.Now().AddDate(-17, 0, 0),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "client must be at least 18 years old",
		},
		{
			name:      "client older than 120",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       time.Date(1800, 1, 1, 0, 0, 0, 0, time.UTC),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "invalid date of birth",
		},
		{
			name:      "empty phone",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       validDOB(),
			phone:     "",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
			wantErr:   true,
			errMsg:    "phone is required",
		},
		{
			name:      "exactly 18 years old",
			userID:    userID,
			firstName: "Juan",
			lastName:  "Perez",
			dni:       validDNI(),
			cuit:      validCUIT(),
			dob:       time.Now().AddDate(-18, 0, -1),
			phone:     "+541155551234",
			address:   "Addr",
			city:      "City",
			province:  "Prov",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := model.NewClient(
				tt.userID, tt.firstName, tt.lastName, tt.dni, tt.cuit,
				tt.dob, tt.phone, tt.address, tt.city, tt.province, "Argentina", tt.isPEP, "AR",
			)
			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
				assert.Nil(t, client)
			} else {
				require.NoError(t, err)
				require.NotNil(t, client)
				assert.Equal(t, tt.firstName, client.FirstName)
				assert.Equal(t, tt.lastName, client.LastName)
				assert.Equal(t, tt.dni, client.DNI)
				assert.Equal(t, tt.cuit, client.CUIT)
				assert.Equal(t, tt.isPEP, client.IsPEP)
				assert.False(t, client.IsBlocked)
			}
		})
	}
}

func TestClient_FullName(t *testing.T) {
	client, err := model.NewClient(
		uuid.New(), "Juan", "Perez", validDNI(), validCUIT(),
		validDOB(), "+541155551234", "Addr", "City", "Prov", "Argentina", false, "AR",
	)
	require.NoError(t, err)
	assert.Equal(t, "Juan Perez", client.FullName())
}

func TestClient_Block(t *testing.T) {
	client, err := model.NewClient(
		uuid.New(), "Juan", "Perez", validDNI(), validCUIT(),
		validDOB(), "+541155551234", "Addr", "City", "Prov", "Argentina", false, "AR",
	)
	require.NoError(t, err)
	assert.False(t, client.IsBlocked)

	client.Block()
	assert.True(t, client.IsBlocked)
}

func TestClient_Unblock(t *testing.T) {
	client, err := model.NewClient(
		uuid.New(), "Juan", "Perez", validDNI(), validCUIT(),
		validDOB(), "+541155551234", "Addr", "City", "Prov", "Argentina", false, "AR",
	)
	require.NoError(t, err)

	client.Block()
	assert.True(t, client.IsBlocked)

	client.Unblock()
	assert.False(t, client.IsBlocked)
}

func TestClient_UpdateProfile(t *testing.T) {
	client, err := model.NewClient(
		uuid.New(), "Juan", "Perez", validDNI(), validCUIT(),
		validDOB(), "+541155551234", "Addr", "City", "Prov", "Argentina", false, "AR",
	)
	require.NoError(t, err)

	client.UpdateProfile("+541199998888", "New Addr", "New City", "New Prov", "Chile")
	assert.Equal(t, "+541199998888", client.Phone)
	assert.Equal(t, "New Addr", client.Address)
	assert.Equal(t, "New City", client.City)
	assert.Equal(t, "New Prov", client.Province)
	assert.Equal(t, "Chile", client.Country)

	// Empty values should not overwrite
	client.UpdateProfile("", "", "", "", "")
	assert.Equal(t, "+541199998888", client.Phone)
	assert.Equal(t, "New Addr", client.Address)
}

func TestClient_SetMercadoPagoLink(t *testing.T) {
	client, err := model.NewClient(
		uuid.New(), "Juan", "Perez", validDNI(), validCUIT(),
		validDOB(), "+541155551234", "Addr", "City", "Prov", "Argentina", false, "AR",
	)
	require.NoError(t, err)

	assert.Empty(t, client.MercadoPagoLink)
	client.SetMercadoPagoLink("https://mpago.la/abc123")
	assert.Equal(t, "https://mpago.la/abc123", client.MercadoPagoLink)
}
