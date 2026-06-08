package model_test

import (
	"testing"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewVendor(t *testing.T) {
	tests := []struct {
		name         string
		businessName string
		cuit         string
		phone        string
		wantErr      bool
		errMsg       string
	}{
		{
			name:         "valid vendor",
			businessName: "Comercio Test",
			cuit:         "20-12345678-6",
			phone:        "3564123456",
		},
		{
			name:         "empty business name",
			businessName: "",
			cuit:         "20-12345678-6",
			phone:        "3564123456",
			wantErr:      true,
			errMsg:       "business name is required",
		},
		{
			name:         "invalid CUIT",
			businessName: "Comercio Test",
			cuit:         "12345",
			phone:        "3564123456",
			wantErr:      true,
			errMsg:       "invalid tax ID",
		},
		{
			name:         "empty phone",
			businessName: "Comercio Test",
			cuit:         "20-12345678-6",
			phone:        "",
			wantErr:      true,
			errMsg:       "phone is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			vendor, err := model.NewVendor(uuid.New(), tt.businessName, tt.cuit, tt.phone, "Av. Siempreviva 742", "Villanueva", "Córdoba", "Argentina", "AR")
			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
				assert.Nil(t, vendor)
			} else {
				require.NoError(t, err)
				require.NotNil(t, vendor)
				assert.NotEqual(t, uuid.Nil, vendor.ID)
				assert.Equal(t, tt.businessName, vendor.BusinessName)
				assert.Equal(t, tt.cuit, vendor.CUIT)
				assert.True(t, vendor.IsActive)
			}
		})
	}
}

func TestVendor_ActivateDeactivate(t *testing.T) {
	vendor, err := model.NewVendor(uuid.New(), "Test", "20-12345678-6", "123", "addr", "city", "prov", "Argentina", "AR")
	require.NoError(t, err)
	assert.True(t, vendor.IsActive)

	vendor.Deactivate()
	assert.False(t, vendor.IsActive)

	vendor.Activate()
	assert.True(t, vendor.IsActive)
}

func TestVendor_UpdateProfile(t *testing.T) {
	vendor, err := model.NewVendor(uuid.New(), "Test", "20-12345678-6", "123", "old addr", "old city", "old prov", "Argentina", "AR")
	require.NoError(t, err)

	vendor.UpdateProfile("999", "new addr", "new city", "new prov", "Chile")
	assert.Equal(t, "999", vendor.Phone)
	assert.Equal(t, "new addr", vendor.Address)
	assert.Equal(t, "new city", vendor.City)
	assert.Equal(t, "new prov", vendor.Province)
}

func TestVendor_UpdateProfile_PartialUpdate(t *testing.T) {
	vendor, err := model.NewVendor(uuid.New(), "Test", "20-12345678-6", "123", "old addr", "old city", "old prov", "Argentina", "AR")
	require.NoError(t, err)

	vendor.UpdateProfile("999", "", "", "", "")
	assert.Equal(t, "999", vendor.Phone)
	assert.Equal(t, "old addr", vendor.Address)
	assert.Equal(t, "old city", vendor.City)
	assert.Equal(t, "old prov", vendor.Province)
}
