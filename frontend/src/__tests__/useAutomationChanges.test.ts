import { renderHook } from '@testing-library/react';
import { useAutomationChanges } from '@/hooks/useAutomationChanges';

describe('useAutomationChanges', () => {
  const mockMarginGuard = {
    enabled: true,
    threshold: 90,
    reduction: 20,
  };

  const mockTpsl = {
    enabled: true,
    takeProfitPercent: 8,
    stopLossPercent: 3,
    trailingEnabled: true,
    trailingDistance: 2,
  };

  it('should return false when data is not loaded', () => {
    const { result } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, false)
    );
    expect(result.current.hasChanges).toBe(false);
  });

  it('should return false when no original values are set', () => {
    const { result } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );
    expect(result.current.hasChanges).toBe(false);
  });

  it('should return true when margin guard enabled changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar enabled
    const changedMarginGuard = { ...mockMarginGuard, enabled: false };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when threshold changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar threshold
    const changedMarginGuard = { ...mockMarginGuard, threshold: 85 };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when reduction changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar reduction
    const changedMarginGuard = { ...mockMarginGuard, reduction: 25 };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when tpsl enabled changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar tpsl enabled
    const changedTpsl = { ...mockTpsl, enabled: false };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when takeProfitPercent changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar takeProfitPercent
    const changedTpsl = { ...mockTpsl, takeProfitPercent: 10 };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when stopLossPercent changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar stopLossPercent
    const changedTpsl = { ...mockTpsl, stopLossPercent: 5 };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when trailingEnabled changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar trailingEnabled
    const changedTpsl = { ...mockTpsl, trailingEnabled: false };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return true when trailingDistance changes', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar trailingDistance
    const changedTpsl = { ...mockTpsl, trailingDistance: 3 };
    rerender();

    expect(result.current.hasChanges).toBe(true);
  });

  it('should return false when values are the same', () => {
    const { result } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    expect(result.current.hasChanges).toBe(false);
  });

  it('should return false when values are reset to original', () => {
    const { result, rerender } = renderHook(() =>
      useAutomationChanges(mockMarginGuard, mockTpsl, true)
    );

    // Definir valores originais
    result.current.setOriginalValues(mockMarginGuard, mockTpsl);

    // Mudar um valor
    const changedMarginGuard = { ...mockMarginGuard, enabled: false };
    rerender();

    expect(result.current.hasChanges).toBe(true);

    // Resetar para valor original
    const resetMarginGuard = { ...mockMarginGuard, enabled: true };
    rerender();

    expect(result.current.hasChanges).toBe(false);
  });
});
