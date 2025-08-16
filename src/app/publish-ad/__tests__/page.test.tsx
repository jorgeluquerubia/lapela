import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublishAd from '../page';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
    })),
  },
}));

// Type assertion for mocked functions
const mockedUseRouter = useRouter as jest.Mock;
const mockedGetUser = supabase.auth.getUser as jest.Mock;
const mockedStorageFrom = supabase.storage.from as jest.Mock;
const mockedFrom = supabase.from as jest.Mock;

describe('PublishAd Page', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock router
    mockRouterPush = jest.fn();
    mockedUseRouter.mockReturnValue({
      push: mockRouterPush,
    });

    // Setup mock user by default
    mockedGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
    });

    // Setup mock profile
    mockedFrom.mockImplementation((tableName: string) => {
        if (tableName === 'profiles') {
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { username: 'testuser' }, error: null }),
            };
        }
        if (tableName === 'products') {
            return {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { slug: 'new-product-slug' }, error: null }),
            };
        }
        return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        };
    });

    // Setup mock storage
    mockedStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/image.png' } }),
    });
  });

  it('renders the form correctly', async () => {
    render(<PublishAd />);
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /publicar un nuevo anuncio/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/título del anuncio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio \(€\)/i)).toBeInTheDocument();
    expect(screen.getByText(/precio fijo/i)).toBeInTheDocument();
    expect(screen.getByText(/subasta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publicar anuncio/i })).toBeInTheDocument();
  });

  it('redirects to login if user is not authenticated', async () => {
    mockedGetUser.mockResolvedValue({ data: { user: null } });
    render(<PublishAd />);
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });

  it('allows user to fill the form', async () => {
    render(<PublishAd />);
    await waitFor(() => expect(screen.getByLabelText(/título del anuncio/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/título del anuncio/i), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'This is a test description.' } });
    fireEvent.change(screen.getByLabelText(/Precio \(€\)/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/ubicación/i), { target: { value: 'Test Location' } });

    expect(screen.getByLabelText(/título del anuncio/i)).toHaveValue('Test Product');
    expect(screen.getByLabelText(/descripción/i)).toHaveValue('This is a test description.');
    expect(screen.getByLabelText(/Precio \(€\)/i)).toHaveValue(100);
    expect(screen.getByLabelText(/ubicación/i)).toHaveValue('Test Location');
  });

  it('shows auction end date field when auction type is selected', async () => {
    render(<PublishAd />);
    await waitFor(() => expect(screen.getByLabelText(/título del anuncio/i)).toBeInTheDocument());

    const auctionRadio = screen.getByLabelText(/subasta/i);
    expect(screen.queryByLabelText(/finalización de la subasta/i)).not.toBeInTheDocument();
    
    fireEvent.click(auctionRadio);
    
    expect(screen.getByLabelText(/finalización de la subasta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/puja inicial/i)).toBeInTheDocument();
  });

  it('handles successful form submission', async () => {
    const { container } = render(<PublishAd />);
    await waitFor(() => expect(screen.getByLabelText(/título del anuncio/i)).toBeInTheDocument());

    // Fill form
    fireEvent.change(screen.getByLabelText(/título del anuncio/i), { target: { value: 'New Bike' } });
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'A very good bike.' } });
    fireEvent.change(screen.getByLabelText(/Precio \(€\)/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/ubicación/i), { target: { value: 'Madrid' } });

    // Simulate file upload using a more robust selector
    const file = new File(['(⌐□_□)'], 'bike.png', { type: 'image/png' });
    const imageInput = container.querySelector('#image-upload');
    expect(imageInput).not.toBeNull();
    fireEvent.change(imageInput!, { target: { files: [file] } });

    // Wait for the image preview to appear, confirming the file is processed
    await screen.findByAltText('Vista previa');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /publicar anuncio/i });
    fireEvent.click(submitButton);

    // Wait for submission to complete and redirect
    await waitFor(() => {
        // Check if storage upload was called
        expect(mockedStorageFrom).toHaveBeenCalledWith('product-images');
        
        // Check if product was inserted
        const insertCall = (mockedFrom.mock.results[1].value.insert as jest.Mock).mock.calls[0][0][0];
        expect(insertCall).toMatchObject({
            name: 'New Bike',
            description: 'A very good bike.',
            price: 250,
            location: 'Madrid',
            seller: 'testuser',
        });

        // Check for redirect
        expect(mockRouterPush).toHaveBeenCalledWith('/ad-detail/new-product-slug');
    });
  });

  it('shows an error message if image upload fails', async () => {
    // Mock storage upload to fail
    mockedStorageFrom.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
        getPublicUrl: jest.fn(),
    });

    const { container } = render(<PublishAd />);
    await waitFor(() => expect(screen.getByLabelText(/título del anuncio/i)).toBeInTheDocument());

    // Fill form completely and select image
    fireEvent.change(screen.getByLabelText(/título del anuncio/i), { target: { value: 'Faulty Product' } });
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'This will fail to upload' } });
    fireEvent.change(screen.getByLabelText(/Precio \(€\)/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/ubicación/i), { target: { value: 'Madrid' } });
    
    const file = new File(['dummy'], 'faulty.png', { type: 'image/png' });
    const imageInput = container.querySelector('#image-upload');
    expect(imageInput).not.toBeNull();
    fireEvent.change(imageInput!, { target: { files: [file] } });

    // Wait for the image preview to appear, confirming the file is processed
    await screen.findByAltText('Vista previa');

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /publicar anuncio/i }));

    // Wait for submission to start
    await waitFor(() => {
      expect(screen.getByText(/Publicando.../i)).toBeInTheDocument();
    });

    // Check for error message and that submission has ended
    await waitFor(() => {
      expect(screen.queryByText(/Publicando.../i)).not.toBeInTheDocument();
      expect(screen.getByText(/error al subir la imagen: Upload failed/i)).toBeInTheDocument();
    });
  });
});
