package service

import (
	"context"
	"fmt"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/model"
	"github.com/diogenes-moreira/creditos/backend/internal/domain/port"
	"github.com/google/uuid"
)

type VendorService struct {
	userRepo          port.UserRepository
	vendorRepo        port.VendorRepository
	vendorAccountRepo port.VendorAccountRepository
	authService       port.AuthService
	audit             *AuditService
	country           string
}

func NewVendorService(
	userRepo port.UserRepository,
	vendorRepo port.VendorRepository,
	vendorAccountRepo port.VendorAccountRepository,
	authService port.AuthService,
	audit *AuditService,
	country string,
) *VendorService {
	return &VendorService{
		userRepo:          userRepo,
		vendorRepo:        vendorRepo,
		vendorAccountRepo: vendorAccountRepo,
		authService:       authService,
		audit:             audit,
		country:           country,
	}
}

func (s *VendorService) Register(ctx context.Context, email, password, businessName, cuit, phone, address, city, province, country string) (*model.Vendor, *model.User, error) {
	existing, _ := s.vendorRepo.FindByCUIT(ctx, cuit)
	if existing != nil {
		return nil, nil, fmt.Errorf("a vendor with CUIT %s already exists", cuit)
	}

	fbUser, err := s.authService.CreateUser(ctx, email, password)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create auth user: %w", err)
	}

	user, err := model.NewUser(fbUser.UID, email, model.RoleVendor)
	if err != nil {
		return nil, nil, err
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	vendor, err := model.NewVendor(user.ID, businessName, cuit, phone, address, city, province, country, s.country)
	if err != nil {
		return nil, nil, err
	}

	if err := s.vendorRepo.Create(ctx, vendor); err != nil {
		return nil, nil, fmt.Errorf("failed to create vendor: %w", err)
	}

	account := model.NewVendorAccount(vendor.ID)
	if err := s.vendorAccountRepo.Create(ctx, account); err != nil {
		return nil, nil, fmt.Errorf("failed to create vendor account: %w", err)
	}

	s.audit.Record(ctx, &user.ID, "register", "vendor", vendor.ID.String(), fmt.Sprintf("Vendor %s registered", vendor.BusinessName))

	return vendor, user, nil
}

func (s *VendorService) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Vendor, error) {
	return s.vendorRepo.FindByUserID(ctx, userID)
}

func (s *VendorService) GetByID(ctx context.Context, id uuid.UUID) (*model.Vendor, error) {
	return s.vendorRepo.FindByID(ctx, id)
}

func (s *VendorService) Search(ctx context.Context, query string, offset, limit int) ([]model.Vendor, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if query != "" {
		return s.vendorRepo.Search(ctx, query, offset, limit)
	}
	return s.vendorRepo.FindAll(ctx, offset, limit)
}

func (s *VendorService) UpdateProfile(ctx context.Context, userID uuid.UUID, phone, address, city, province, country string) (*model.Vendor, error) {
	vendor, err := s.vendorRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	vendor.UpdateProfile(phone, address, city, province, country)
	if err := s.vendorRepo.Update(ctx, vendor); err != nil {
		return nil, err
	}
	s.audit.Record(ctx, &userID, "update_profile", "vendor", vendor.ID.String(), "Vendor profile updated")
	return vendor, nil
}

func (s *VendorService) Activate(ctx context.Context, adminID, vendorID uuid.UUID) error {
	vendor, err := s.vendorRepo.FindByID(ctx, vendorID)
	if err != nil {
		return err
	}
	vendor.Activate()
	if err := s.vendorRepo.Update(ctx, vendor); err != nil {
		return err
	}
	s.audit.Record(ctx, &adminID, "activate_vendor", "vendor", vendor.ID.String(), fmt.Sprintf("Vendor %s activated", vendor.BusinessName))
	return nil
}

func (s *VendorService) Deactivate(ctx context.Context, adminID, vendorID uuid.UUID) error {
	vendor, err := s.vendorRepo.FindByID(ctx, vendorID)
	if err != nil {
		return err
	}
	vendor.Deactivate()
	if err := s.vendorRepo.Update(ctx, vendor); err != nil {
		return err
	}
	s.audit.Record(ctx, &adminID, "deactivate_vendor", "vendor", vendor.ID.String(), fmt.Sprintf("Vendor %s deactivated", vendor.BusinessName))
	return nil
}
