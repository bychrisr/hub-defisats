import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Automation } from '@/pages/Automation';
import { useAutomationStore } from '@/stores/automation';

// Mock do store
jest.mock('@/stores/automation', () => ({
  useAutomationStore: () => ({
    automations: [],
    fetchAutomations: jest.fn(),
    createAutomation: jest.fn(),
    updateAutomation: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

// Mock dos hooks
jest.mock('@/hooks/useBtcPrice', () => ({
  useBtcPrice: () => ({
    data: { price: 50000 },
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/contexts/RealtimeDataContext', () => ({
  useUserPositions: () => [],
}));

describe('Automation Integration', () => {
  it('should render automation page', () => {
    render(<Automation />);
    
    expect(screen.getByText('Automações Inteligentes')).toBeInTheDocument();
    expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
  });

  it('should show save button as disabled initially', () => {
    render(<Automation />);
    
    const saveButton = screen.getByText('Salvar Configurações');
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when margin guard is toggled', async () => {
    render(<Automation />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });

    // Toggle margin guard
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Verificar se botão fica enabled
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).not.toBeDisabled();
    });
  });

  it('should show unsaved changes warning when changes are made', async () => {
    render(<Automation />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });

    // Toggle margin guard
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Verificar se aviso aparece
    await waitFor(() => {
      expect(screen.getByText('Mudanças não salvas')).toBeInTheDocument();
    });
  });

  it('should disable save button after saving', async () => {
    const mockCreateAutomation = jest.fn().mockResolvedValue({});
    const mockUpdateAutomation = jest.fn().mockResolvedValue({});

    // Mock do store com funções
    jest.mocked(useAutomationStore).mockReturnValue({
      automations: [],
      fetchAutomations: jest.fn(),
      createAutomation: mockCreateAutomation,
      updateAutomation: mockUpdateAutomation,
      isLoading: false,
      error: null,
    });

    render(<Automation />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });

    // Fazer mudança
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Salvar
    const saveButton = screen.getByText('Salvar Configurações');
    fireEvent.click(saveButton);

    // Verificar se botão fica disabled
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeDisabled();
    });
  });

  it('should handle save errors gracefully', async () => {
    const mockCreateAutomation = jest.fn().mockRejectedValue(new Error('Save failed'));

    // Mock do store com erro
    jest.mocked(useAutomationStore).mockReturnValue({
      automations: [],
      fetchAutomations: jest.fn(),
      createAutomation: mockCreateAutomation,
      updateAutomation: jest.fn(),
      isLoading: false,
      error: null,
    });

    render(<Automation />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });

    // Fazer mudança
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // Salvar
    const saveButton = screen.getByText('Salvar Configurações');
    fireEvent.click(saveButton);

    // Verificar se erro é tratado
    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).not.toBeDisabled();
    });
  });
});
