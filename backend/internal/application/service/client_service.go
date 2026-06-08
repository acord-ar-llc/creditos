package service

import (
	"context"
	"fmt"
	"time"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/model"
	"github.com/diogenes-moreira/creditos/backend/internal/domain/port"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type ClientService struct {
	userRepo    port.UserRepository
	clientRepo  port.ClientRepository
	accountRepo port.AccountRepository
	authService port.AuthService
	audit       *AuditService
	country     string
}

func NewClientService(
	userRepo port.UserRepository,
	clientRepo port.ClientRepository,
	accountRepo port.AccountRepository,
	authService port.AuthService,
	audit *AuditService,
	country string,
) *ClientService {
	return &ClientService{
		userRepo:    userRepo,
		clientRepo:  clientRepo,
		accountRepo: accountRepo,
		authService: authService,
		audit:       audit,
		country:     country,
	}
}

func (s *ClientService) Register(ctx context.Context, email, firstName, lastName, dni, cuit, dobStr, phone, address, city, province, country string, isPEP bool) (*model.Client, *model.User, error) {
	dob, err := time.Parse("2006-01-02", dobStr)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid date of birth format, use YYYY-MM-DD")
	}

	existing, _ := s.clientRepo.FindByDNI(ctx, dni)
	if existing != nil {
		return nil, nil, fmt.Errorf("a client with DNI %s already exists", dni)
	}

	existing, _ = s.clientRepo.FindByCUIT(ctx, cuit)
	if existing != nil {
		return nil, nil, fmt.Errorf("a client with CUIT %s already exists", cuit)
	}

	fbUser, err := s.authService.CreateUser(ctx, email, "")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create auth user: %w", err)
	}

	user, err := model.NewUser(fbUser.UID, email, model.RoleClient)
	if err != nil {
		return nil, nil, err
	}
	user.SetPhone(phone)

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, nil, fmt.Errorf("failed to create user: %w", err)
	}

	client, err := model.NewClient(user.ID, firstName, lastName, dni, cuit, dob, phone, address, city, province, country, isPEP, s.country)
	if err != nil {
		return nil, nil, err
	}

	if err := s.clientRepo.Create(ctx, client); err != nil {
		return nil, nil, fmt.Errorf("failed to create client: %w", err)
	}

	account := model.NewCurrentAccount(client.ID)
	account.Balance = decimal.NewFromInt(0)
	if err := s.accountRepo.Create(ctx, account); err != nil {
		return nil, nil, fmt.Errorf("failed to create account: %w", err)
	}

	s.audit.Record(ctx, &user.ID, "register", "client", client.ID.String(), fmt.Sprintf("Client %s registered", client.FullName()))

	return client, user, nil
}

func (s *ClientService) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.Client, error) {
	return s.clientRepo.FindByUserID(ctx, userID)
}

func (s *ClientService) GetByID(ctx context.Context, id uuid.UUID) (*model.Client, error) {
	return s.clientRepo.FindByID(ctx, id)
}

func (s *ClientService) UpdateProfile(ctx context.Context, userID uuid.UUID, phone, address, city, province, country string) (*model.Client, error) {
	client, err := s.clientRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	client.UpdateProfile(phone, address, city, province, country)
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return nil, err
	}
	s.audit.Record(ctx, &userID, "update_profile", "client", client.ID.String(), "Profile updated")
	return client, nil
}

func (s *ClientService) SetMercadoPagoLink(ctx context.Context, userID uuid.UUID, link string) error {
	client, err := s.clientRepo.FindByUserID(ctx, userID)
	if err != nil {
		return err
	}
	client.SetMercadoPagoLink(link)
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return err
	}
	s.audit.Record(ctx, &userID, "set_mercadopago", "client", client.ID.String(), "MercadoPago link updated")
	return nil
}

func (s *ClientService) Search(ctx context.Context, query string, offset, limit int) ([]model.Client, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if query != "" {
		return s.clientRepo.Search(ctx, query, offset, limit)
	}
	return s.clientRepo.FindAll(ctx, offset, limit)
}

func (s *ClientService) UpdateIVARate(ctx context.Context, adminID, clientID uuid.UUID, rate float64) (*model.Client, error) {
	client, err := s.clientRepo.FindByID(ctx, clientID)
	if err != nil {
		return nil, err
	}
	client.SetIVARate(decimal.NewFromFloat(rate))
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return nil, err
	}
	s.audit.Record(ctx, &adminID, "update_iva_rate", "client", client.ID.String(), fmt.Sprintf("IVA rate updated to %.2f%%", rate))
	return client, nil
}

func (s *ClientService) UpdateComments(ctx context.Context, adminID, clientID uuid.UUID, comments string) (*model.Client, error) {
	client, err := s.clientRepo.FindByID(ctx, clientID)
	if err != nil {
		return nil, err
	}
	client.SetComments(comments)
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return nil, err
	}
	s.audit.Record(ctx, &adminID, "update_comments", "client", client.ID.String(), "Client comments updated")
	return client, nil
}

func (s *ClientService) AdminUpdateClient(ctx context.Context, adminID, clientID uuid.UUID, firstName, lastName, dni, cuit, phone, address, city, province, country string, isPEP bool) (*model.Client, error) {
	client, err := s.clientRepo.FindByID(ctx, clientID)
	if err != nil {
		return nil, err
	}
	client.AdminUpdate(firstName, lastName, dni, cuit, phone, address, city, province, country, isPEP)
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return nil, err
	}
	s.audit.Record(ctx, &adminID, "admin_update_client", "client", client.ID.String(), fmt.Sprintf("Client %s updated by admin", client.FullName()))
	return client, nil
}

func (s *ClientService) Block(ctx context.Context, adminID, clientID uuid.UUID) error {
	client, err := s.clientRepo.FindByID(ctx, clientID)
	if err != nil {
		return err
	}
	client.Block()
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return err
	}
	s.audit.Record(ctx, &adminID, "block_client", "client", client.ID.String(), fmt.Sprintf("Client %s blocked", client.FullName()))
	return nil
}

func (s *ClientService) Unblock(ctx context.Context, adminID, clientID uuid.UUID) error {
	client, err := s.clientRepo.FindByID(ctx, clientID)
	if err != nil {
		return err
	}
	client.Unblock()
	if err := s.clientRepo.Update(ctx, client); err != nil {
		return err
	}
	s.audit.Record(ctx, &adminID, "unblock_client", "client", client.ID.String(), fmt.Sprintf("Client %s unblocked", client.FullName()))
	return nil
}
