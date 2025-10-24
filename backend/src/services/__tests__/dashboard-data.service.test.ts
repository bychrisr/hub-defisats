import { DashboardDataService } from '../dashboard-data.service';
import mockPayload from './fixtures/lnmarkets-ok.json';

describe('DashboardDataService', () => {
  let service: DashboardDataService;

  beforeEach(() => {
    // Mock the dependencies
    const mockPrisma = {} as any;
    const mockAccountCredentialsService = {} as any;
    
    service = new DashboardDataService({
      prisma: mockPrisma,
      accountCredentialsService: mockAccountCredentialsService
    });
  });

  it('preserves metrics > 0 with valid fixture', async () => {
    const dto = await service.mapToDashboardDTO(mockPayload);
    
    // Test that all metrics are greater than 0
    expect(dto.totalFees).toBeGreaterThan(0);
    expect(dto.totalTradingFees).toBeGreaterThan(0);
    expect(dto.totalFundingCost).toBeGreaterThan(0);
    expect(dto.lastUpdate).toBeGreaterThan(0);
    
    // Test specific values from fixture
    expect(dto.totalPL).toBe(200); // unrealized_pnl from position
    expect(dto.totalMargin).toBe(1000); // margin from position
    expect(dto.totalFees).toBe(10); // opening_fee + closing_fee
    expect(dto.totalTradingFees).toBe(10); // opening_fee + closing_fee
    expect(dto.totalFundingCost).toBe(10); // sum_carry_fees
    expect(dto.lastUpdate).toBe(1640995200000); // timestamp from fixture
  });

  it('handles empty positions array', async () => {
    const emptyPayload = {
      ...mockPayload,
      positions: []
    };
    
    const dto = await service.mapToDashboardDTO(emptyPayload);
    
    // All metrics should be 0 for empty positions
    expect(dto.totalPL).toBe(0);
    expect(dto.totalMargin).toBe(0);
    expect(dto.totalFees).toBe(0);
    expect(dto.totalTradingFees).toBe(0);
    expect(dto.totalFundingCost).toBe(0);
    expect(dto.lastUpdate).toBe(1640995200000);
  });

  it('validates DTO schema', async () => {
    const dto = await service.mapToDashboardDTO(mockPayload);
    
    // Test that the DTO has all required fields
    expect(dto).toHaveProperty('totalPL');
    expect(dto).toHaveProperty('totalMargin');
    expect(dto).toHaveProperty('totalFees');
    expect(dto).toHaveProperty('totalTradingFees');
    expect(dto).toHaveProperty('totalFundingCost');
    expect(dto).toHaveProperty('lastUpdate');
    
    // Test that all fields are numbers
    expect(typeof dto.totalPL).toBe('number');
    expect(typeof dto.totalMargin).toBe('number');
    expect(typeof dto.totalFees).toBe('number');
    expect(typeof dto.totalTradingFees).toBe('number');
    expect(typeof dto.totalFundingCost).toBe('number');
    expect(typeof dto.lastUpdate).toBe('number');
  });
});
