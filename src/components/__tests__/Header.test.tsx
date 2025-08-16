import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { AuthProvider } from '@/context/AuthContext';

// Mock the supabase client to avoid import errors and isolate the component
jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => {
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      }),
      getSession: jest.fn(() => ({
        data: { session: null },
      })),
    },
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Header', () => {
  it('renders the header with the application title', async () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    );

    const titleElement = await screen.findByText(/lapela/i);
    expect(titleElement).toBeInTheDocument();
  });
});
