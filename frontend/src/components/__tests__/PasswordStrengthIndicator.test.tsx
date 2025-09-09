import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';

const mockProps = {
  strength: 3,
  labels: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'],
  colors: [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ],
};

describe('PasswordStrengthIndicator', () => {
  it('renders without crashing', () => {
    render(<PasswordStrengthIndicator password="test123" {...mockProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows password strength indicator', () => {
    render(<PasswordStrengthIndicator password="test123" {...mockProps} />);
    expect(screen.getByText('Password strength: Fair')).toBeInTheDocument();
  });

  it('shows very weak indicator for strength 0', () => {
    render(
      <PasswordStrengthIndicator
        password="123"
        {...{ ...mockProps, strength: 0 }}
      />
    );
    expect(
      screen.getByText('Password strength: Very Weak')
    ).toBeInTheDocument();
  });

  it('shows strong indicator for strength 5', () => {
    render(
      <PasswordStrengthIndicator
        password="MyStr0ng!P@ssw0rd"
        {...{ ...mockProps, strength: 5 }}
      />
    );
    expect(screen.getByText('Password strength: Strong')).toBeInTheDocument();
  });

  it('returns null when no password provided', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="" {...mockProps} />
    );
    expect(container.firstChild).toBeNull();
  });
});
