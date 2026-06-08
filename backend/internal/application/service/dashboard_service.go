package service

import (
	"context"
	"time"

	"github.com/diogenes-moreira/creditos/backend/internal/domain/port"
)

type DashboardService struct {
	dashRepo port.DashboardRepository
}

func NewDashboardService(dashRepo port.DashboardRepository) *DashboardService {
	return &DashboardService{dashRepo: dashRepo}
}

func (s *DashboardService) GetPortfolio(ctx context.Context) (*port.PortfolioSummary, error) {
	return s.dashRepo.PortfolioSummary(ctx)
}

func (s *DashboardService) GetDelinquency(ctx context.Context) (*port.DelinquencyStats, error) {
	return s.dashRepo.DelinquencyRates(ctx)
}

func (s *DashboardService) GetKPIs(ctx context.Context) (*port.PortfolioSummary, *port.DelinquencyStats, error) {
	portfolio, err := s.dashRepo.PortfolioSummary(ctx)
	if err != nil {
		return nil, nil, err
	}
	delinquency, err := s.dashRepo.DelinquencyRates(ctx)
	if err != nil {
		return nil, nil, err
	}
	return portfolio, delinquency, nil
}

func (s *DashboardService) GetOverdueInstallments(ctx context.Context, offset, limit int) ([]port.OverdueInstallment, int64, error) {
	return s.dashRepo.OverdueInstallments(ctx, offset, limit)
}

func (s *DashboardService) GetDisbursementTrend(ctx context.Context, months int) ([]port.TrendPoint, error) {
	to := time.Now()
	from := to.AddDate(0, -months, 0)
	return s.dashRepo.DisbursementTrend(ctx, from, to)
}

func (s *DashboardService) GetCollectionTrend(ctx context.Context, months int) ([]port.TrendPoint, error) {
	to := time.Now()
	from := to.AddDate(0, -months, 0)
	return s.dashRepo.CollectionTrend(ctx, from, to)
}
