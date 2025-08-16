import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import Login from '../page';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Supabase
jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedSignIn = supabase.auth.signInWithPassword as jest.Mock;

describe('Login Page', () => {
  let mockPush: jest.Mock;
  let mockRefresh: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock router
    mockPush = jest.fn();
    mockRefresh = jest.fn();
    mockedUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    
    // Setup default auth state (not authenticated)
    mockedUseAuth.mockReturnValue({
      session: null,
      loading: false,
    });
    
    // Setup default Supabase response
    mockedSignIn.mockResolvedValue({ error: null });
  });

  it('renders login form correctly', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByText(/¿no tienes cuenta\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /regístrate aquí/i })).toBeInTheDocument();
  });

  it('allows user to input email and password', () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('handles successful login', async () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Check that Supabase signIn was called with correct parameters
    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Check that user is redirected to home page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error message when login fails', async () => {
    const errorMessage = 'Invalid login credentials';
    mockedSignIn.mockResolvedValueOnce({ error: { message: errorMessage } });

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Check that button is not loading anymore
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciando.../i })).not.toBeInTheDocument();
  });

  it('shows loading state during login', async () => {
    // Make signIn take some time to resolve
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });
    mockedSignIn.mockReturnValue(signInPromise);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Fill form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciando.../i })).toBeInTheDocument();
    });

    // Check that inputs are disabled during loading
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Resolve the promise to end loading state
    resolveSignIn!({ error: null });

    // Wait for redirect instead of button state change, since successful login redirects
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to home page if user is already authenticated', () => {
    mockedUseAuth.mockReturnValue({
      session: { user: { id: '123', email: 'test@example.com' } },
      loading: false,
    });

    render(<Login />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows loading message while auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      loading: true,
    });

    render(<Login />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows loading message when user session exists but auth is still loading', () => {
    mockedUseAuth.mockReturnValue({
      session: { user: { id: '123', email: 'test@example.com' } },
      loading: false,
    });

    render(<Login />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('prevents form submission with empty fields', async () => {
    render(<Login />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    // Try to submit empty form
    fireEvent.click(submitButton);

    // Check that Supabase signIn was not called
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('prevents form submission when loading', async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise((resolve) => {
      resolveSignIn = resolve;
    });
    mockedSignIn.mockReturnValue(signInPromise);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Fill and submit form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciando.../i })).toBeInTheDocument();
    });

    // Try to submit again while loading
    const loadingButton = screen.getByRole('button', { name: /iniciando.../i });
    fireEvent.click(loadingButton);

    // Should only have been called once
    expect(mockedSignIn).toHaveBeenCalledTimes(1);

    resolveSignIn!({ error: null });
  });
});
