import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Account from '../page';
import * as authContext from '@/context/AuthContext';
import * as apiModule from '@/lib/api';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}));

jest.mock('@/lib/api', () => ({
  api: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
});

describe('User Account - Public Profile Customization (/user-profile) (LP-FEAT-013)', () => {
  const mockUser = {
    id: 'user-uuid-1234',
    email: 'testuser@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login prompt when user is not authenticated', () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<Account />);
    expect(screen.getByText('Tu cuenta de La Pela')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login');
  });

  it('loads profile and displays alias customization form when alias is not customized (AC-01)', async () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiModule.api as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'profile/me') {
        return Promise.resolve({
          id: mockUser.id,
          alias: 'usuario-1234abcd5678',
          alias_customized: false,
          show_purchases: false,
        });
      }
      return Promise.resolve({});
    });

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByText('Tu alias público')).toBeInTheDocument();
    });

    const aliasInput = screen.getByLabelText(/alias/i);
    expect(aliasInput).toBeInTheDocument();
    expect(aliasInput).not.toBeDisabled();
    expect(aliasInput).toHaveValue('usuario-1234abcd5678');
    expect(screen.getByText(/usa letras minúsculas, números, guiones o guiones bajos/i)).toBeInTheDocument();

    const purchasesCheckbox = screen.getByLabelText(/mostrar mis compras completadas en mi perfil público/i);
    expect(purchasesCheckbox).not.toBeChecked();

    const publicProfileLink = screen.getByRole('link', { name: /ver perfil público/i });
    expect(publicProfileLink).toHaveAttribute('href', '/usuarios/usuario-1234abcd5678');
  });

  it('disables alias input when alias is already customized (AC-01)', async () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiModule.api as jest.Mock).mockResolvedValue({
      id: mockUser.id,
      alias: 'mi_alias_fijo',
      alias_customized: true,
      show_purchases: true,
    });

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByText('Tu alias público')).toBeInTheDocument();
    });

    const aliasInput = screen.getByLabelText(/alias/i);
    expect(aliasInput).toBeDisabled();
    expect(aliasInput).toHaveValue('mi_alias_fijo');
    expect(screen.getByText(/tu alias está fijado\. contacta con soporte si necesitas cambiarlo/i)).toBeInTheDocument();

    const purchasesCheckbox = screen.getByLabelText(/mostrar mis compras completadas en mi perfil público/i);
    expect(purchasesCheckbox).toBeChecked();
  });

  it('saves customized alias and show_purchases preference successfully (AC-01, AC-05)', async () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiModule.api as jest.Mock).mockImplementation((endpoint: string, body?: any) => {
      if (endpoint === 'profile/me') {
        return Promise.resolve({
          id: mockUser.id,
          alias: 'usuario-1234abcd5678',
          alias_customized: false,
          show_purchases: false,
        });
      }
      if (endpoint === 'profile') {
        return Promise.resolve({
          id: mockUser.id,
          alias: body.alias,
          alias_customized: true,
          show_purchases: body.showPurchases,
        });
      }
      return Promise.resolve({});
    });

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument();
    });

    const aliasInput = screen.getByLabelText(/alias/i);
    fireEvent.change(aliasInput, { target: { value: 'nuevo_alias_vintage' } });

    const purchasesCheckbox = screen.getByLabelText(/mostrar mis compras completadas en mi perfil público/i);
    fireEvent.click(purchasesCheckbox);

    const saveButton = screen.getByRole('button', { name: /guardar perfil/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiModule.api).toHaveBeenCalledWith('profile', {
        alias: 'nuevo_alias_vintage',
        showPurchases: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/tu alias está fijado/i)).toBeInTheDocument();
    });
  });

  it('displays error message when alias is taken or invalid (AC-01)', async () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiModule.api as jest.Mock).mockImplementation((endpoint: string) => {
      if (endpoint === 'profile/me') {
        return Promise.resolve({
          id: mockUser.id,
          alias: 'usuario-1234abcd5678',
          alias_customized: false,
          show_purchases: false,
        });
      }
      if (endpoint === 'profile') {
        return Promise.reject(new Error('Ese alias ya está en uso.'));
      }
      return Promise.resolve({});
    });

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument();
    });

    const aliasInput = screen.getByLabelText(/alias/i);
    fireEvent.change(aliasInput, { target: { value: 'alias_duplicado' } });

    const saveButton = screen.getByRole('button', { name: /guardar perfil/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Ese alias ya está en uso.');
    });
  });
});
