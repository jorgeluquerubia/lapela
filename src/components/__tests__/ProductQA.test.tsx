import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductQA from '../ProductQA';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockedApi = api as jest.MockedFunction<typeof api>;

describe('ProductQA Component (LP-FEAT-005)', () => {
  const mockQuestions = [
    {
      id: 'q-1',
      listing_id: 'item-1',
      buyer_id: 'buyer-1',
      seller_id: 'seller-1',
      question: '¿Tiene algún golpe en las esquinas?',
      answer: 'No, está en perfecto estado siempre con funda.',
      created_at: new Date('2026-09-01T10:00:00Z').toISOString(),
      answered_at: new Date('2026-09-01T12:00:00Z').toISOString(),
    },
    {
      id: 'q-2',
      listing_id: 'item-1',
      buyer_id: 'buyer-2',
      seller_id: 'seller-1',
      question: '¿Incluye el cargador original?',
      answer: null,
      created_at: new Date('2026-09-02T10:00:00Z').toISOString(),
      answered_at: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Q&A heading and policy banner against bargaining and contact info', async () => {
    mockedApi.mockResolvedValueOnce({
      questions: [],
      totalCount: 0,
      page: 1,
      totalPages: 1,
      pendingCount: 0,
    });

    render(<ProductQA listingId="item-1" isSeller={false} user={null} />);

    expect(await screen.findByRole('heading', { name: /Preguntas y respuestas/i })).toBeInTheDocument();
    expect(screen.getByText(/Sin regateos ni contraofertas/i)).toBeInTheDocument();
    expect(screen.getByText(/no compartas teléfonos, correos electrónicos/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Cargando preguntas/i)).not.toBeInTheDocument());
  });

  it('shows login prompt for unauthenticated users', async () => {
    mockedApi.mockResolvedValueOnce({
      questions: [],
      totalCount: 0,
      page: 1,
      totalPages: 1,
      pendingCount: 0,
    });

    render(<ProductQA listingId="item-1" isSeller={false} user={null} />);

    expect(await screen.findByText(/Inicia sesión/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Cargando preguntas/i)).not.toBeInTheDocument());
  });

  it('displays questions, seller answers, and pending status', async () => {
    mockedApi.mockResolvedValueOnce({
      questions: mockQuestions,
      totalCount: 2,
      page: 1,
      totalPages: 1,
      pendingCount: 1,
    });

    render(<ProductQA listingId="item-1" isSeller={false} user={{ id: 'buyer-3' }} />);

    expect(await screen.findByText('¿Tiene algún golpe en las esquinas?')).toBeInTheDocument();
    expect(screen.getByText('No, está en perfecto estado siempre con funda.')).toBeInTheDocument();
    expect(screen.getByText('¿Incluye el cargador original?')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de respuesta del vendedor')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Cargando preguntas/i)).not.toBeInTheDocument());
  });

  it('allows prospective buyers to ask questions with validation', async () => {
    mockedApi
      .mockResolvedValueOnce({
        questions: [],
        totalCount: 0,
        page: 1,
        totalPages: 1,
        pendingCount: 0,
      })
      .mockResolvedValueOnce({ id: 'q-new' }) // POST question
      .mockResolvedValueOnce({
        questions: [
          {
            id: 'q-new',
            listing_id: 'item-1',
            buyer_id: 'buyer-3',
            seller_id: 'seller-1',
            question: '¿Tiene factura de compra?',
            answer: null,
            created_at: new Date().toISOString(),
            answered_at: null,
          },
        ],
        totalCount: 1,
        page: 1,
        totalPages: 1,
        pendingCount: 1,
      });

    render(<ProductQA listingId="item-1" isSeller={false} user={{ id: 'buyer-3' }} />);

    const textarea = await screen.findByLabelText(/Preguntar al vendedor/i);
    await waitFor(() => expect(screen.queryByText(/Cargando preguntas/i)).not.toBeInTheDocument());

    const submitButton = screen.getByRole('button', { name: /Enviar pregunta/i });
    expect(submitButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '¿Tiene factura de compra?' } });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedApi).toHaveBeenCalledWith('question/item-1', {
        question: '¿Tiene factura de compra?',
      });
    });
    await waitFor(() => expect(screen.getByText('¿Tiene factura de compra?')).toBeInTheDocument());
  });

  it('allows the seller to reply to unanswered questions', async () => {
    mockedApi
      .mockResolvedValueOnce({
        questions: mockQuestions,
        totalCount: 2,
        page: 1,
        totalPages: 1,
        pendingCount: 1,
      })
      .mockResolvedValueOnce({ id: 'q-2', answer: 'Sí, incluye el cargador.' }) // POST answer
      .mockResolvedValueOnce({
        questions: [
          mockQuestions[0],
          { ...mockQuestions[1], answer: 'Sí, incluye el cargador.', answered_at: new Date().toISOString() },
        ],
        totalCount: 2,
        page: 1,
        totalPages: 1,
        pendingCount: 0,
      });

    render(<ProductQA listingId="item-1" isSeller={true} user={{ id: 'seller-1' }} />);

    const respondButton = await screen.findByRole('button', { name: /Responder a esta pregunta/i });
    await waitFor(() => expect(screen.queryByText(/Cargando preguntas/i)).not.toBeInTheDocument());

    fireEvent.click(respondButton);

    const answerInput = screen.getByLabelText(/Tu respuesta pública/i);
    fireEvent.change(answerInput, { target: { value: 'Sí, incluye el cargador.' } });

    const publishButton = screen.getByRole('button', { name: /Publicar respuesta/i });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockedApi).toHaveBeenCalledWith('answer/q-2', {
        answer: 'Sí, incluye el cargador.',
      });
    });
    await waitFor(() => expect(screen.getByText('Sí, incluye el cargador.')).toBeInTheDocument());
  });
});
