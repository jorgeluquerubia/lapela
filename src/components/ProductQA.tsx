'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export interface QuestionItem {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
}

interface ProductQAProps {
  listingId: string;
  isSeller: boolean;
  user: any;
  demo?: boolean;
}

export default function ProductQA({ listingId, isSeller, user, demo = false }: ProductQAProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState('');

  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState('');

  const loadQuestions = useCallback(async (targetPage: number) => {
    if (!listingId || demo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api(`questions/${listingId}?page=${targetPage}`);
      setQuestions(res.questions || []);
      setTotalCount(res.totalCount || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
      setPendingCount(res.pendingCount || 0);
    } catch {
      // If error or endpoint unreachable
    } finally {
      setLoading(false);
    }
  }, [listingId, demo]);

  useEffect(() => {
    loadQuestions(1);
  }, [loadQuestions]);

  async function handleAskSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuestionError('');
    setQuestionSuccess('');

    const clean = newQuestion.trim();
    if (clean.length < 5) {
      setQuestionError('La pregunta debe tener al menos 5 caracteres.');
      return;
    }
    if (clean.length > 1000) {
      setQuestionError('La pregunta no puede superar los 1000 caracteres.');
      return;
    }

    setSubmittingQuestion(true);
    try {
      await api(`question/${listingId}`, { question: clean });
      setNewQuestion('');
      setQuestionSuccess('Tu pregunta se ha publicado. El vendedor podrá responderla públicamente.');
      await loadQuestions(1);
    } catch (err) {
      setQuestionError((err as Error).message || 'No se ha podido enviar la pregunta.');
    } finally {
      setSubmittingQuestion(false);
    }
  }

  async function handleAnswerSubmit(questionId: string) {
    setAnswerError('');
    const draft = (answerDrafts[questionId] || '').trim();
    if (draft.length < 2) {
      setAnswerError('La respuesta debe tener al menos 2 caracteres.');
      return;
    }
    if (draft.length > 1000) {
      setAnswerError('La respuesta no puede superar los 1000 caracteres.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await api(`answer/${questionId}`, { answer: draft });
      setAnsweringId(null);
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
      await loadQuestions(page);
    } catch (err) {
      setAnswerError((err as Error).message || 'No se ha podido publicar la respuesta.');
    } finally {
      setSubmittingAnswer(false);
    }
  }

  return (
    <section className="qa-section" aria-labelledby="qa-heading">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 id="qa-heading" className="text-xl font-bold m-0">
          Preguntas y respuestas {totalCount > 0 && <span className="muted font-normal text-base">({totalCount})</span>}
        </h2>
        {isSeller && pendingCount > 0 && (
          <span className="qa-badge" title="Preguntas sin responder en este anuncio">
            {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="qa-rule-banner">
        <strong>Normativa de la sección de preguntas:</strong>
        <ul>
          <li>
            Las preguntas deben ceñirse a la <strong>naturaleza, detalles, especificaciones o estado</strong> del producto.
          </li>
          <li>
            <strong>Sin regateos ni contraofertas:</strong> en La Pela el precio es cerrado (o se fija por pujas en subastas).
          </li>
          <li>
            <strong>Privacidad:</strong> no compartas teléfonos, correos electrónicos ni enlaces externos.
          </li>
        </ul>
      </div>

      {/* Formulario para hacer una pregunta */}
      {demo ? (
        <div className="notice mb-6">
          En los anuncios de ejemplo no está habilitada la publicación de preguntas.
        </div>
      ) : isSeller ? (
        <div className="notice mb-6">
          Este es tu anuncio. A continuación puedes revisar las preguntas recibidas y responder a los compradores potenciales.
        </div>
      ) : !user ? (
        <div className="notice mb-6">
          ¿Tienes alguna duda sobre este artículo?{' '}
          <Link href="/login" className="underline font-semibold text-emerald-800">
            Inicia sesión
          </Link>{' '}
          para preguntar al vendedor.
        </div>
      ) : (
        <form onSubmit={handleAskSubmit} className="qa-form">
          <label htmlFor="qa-new-question" className="block font-semibold mb-2 text-sm">
            Preguntar al vendedor
          </label>
          <textarea
            id="qa-new-question"
            className="field-input"
            rows={3}
            placeholder="Escribe tu duda sobre las características o estado del producto…"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            disabled={submittingQuestion}
            maxLength={1000}
            required
          />
          <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
            <span>Mínimo 5 caracteres · Sin datos de contacto ni regateos</span>
            <span>{newQuestion.length} / 1000</span>
          </div>

          {questionError && (
            <p className="error-message mb-3" role="alert">
              {questionError}
            </p>
          )}
          {questionSuccess && (
            <div className="notice mb-3" role="status">
              {questionSuccess}
            </div>
          )}

          <button
            type="submit"
            className="button primary"
            disabled={submittingQuestion || newQuestion.trim().length < 5}
          >
            {submittingQuestion ? 'Enviando pregunta…' : 'Enviar pregunta'}
          </button>
        </form>
      )}

      {/* Listado de preguntas */}
      <div className="qa-list">
        {loading ? (
          <p className="muted py-4">Cargando preguntas…</p>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            <p className="m-0 font-medium">Aún no hay preguntas sobre este artículo.</p>
            <p className="muted text-sm mt-1 mb-0">
              Si tienes dudas sobre las medidas, estado o funcionamiento, ¡sé el primero en preguntar!
            </p>
          </div>
        ) : (
          questions.map((q) => (
            <article key={q.id} className="qa-card">
              <div className="qa-question">
                <p>{q.question}</p>
                <div className="qa-meta">
                  <span>
                    Preguntado el{' '}
                    {new Date(q.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Respuesta existente */}
              {q.answer ? (
                <div className="qa-answer">
                  <div className="qa-answer-title">Respuesta del vendedor:</div>
                  <p>{q.answer}</p>
                  {q.answered_at && (
                    <div className="qa-meta mt-1">
                      <span>
                        Respondido el{' '}
                        {new Date(q.answered_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : isSeller ? (
                /* Formulario de respuesta para el vendedor */
                <div className="qa-answer-form">
                  {answeringId === q.id ? (
                    <div>
                      <label htmlFor={`answer-${q.id}`} className="block font-semibold text-xs mb-1">
                        Tu respuesta pública:
                      </label>
                      <textarea
                        id={`answer-${q.id}`}
                        className="field-input"
                        rows={2}
                        placeholder="Escribe una respuesta clara sobre las características del producto…"
                        value={answerDrafts[q.id] || ''}
                        onChange={(e) =>
                          setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        maxLength={1000}
                        disabled={submittingAnswer}
                      />
                      {answerError && (
                        <p className="error-message text-xs py-2 px-3 mb-2" role="alert">
                          {answerError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="button primary text-sm py-2 px-4 min-h-0"
                          disabled={submittingAnswer || !(answerDrafts[q.id] || '').trim()}
                          onClick={() => handleAnswerSubmit(q.id)}
                        >
                          {submittingAnswer ? 'Publicando…' : 'Publicar respuesta'}
                        </button>
                        <button
                          type="button"
                          className="button text-sm py-2 px-4 min-h-0"
                          disabled={submittingAnswer}
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerError('');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="button secondary text-sm py-2 px-3 min-h-0"
                      onClick={() => {
                        setAnsweringId(q.id);
                        setAnswerError('');
                      }}
                    >
                      Responder a esta pregunta
                    </button>
                  )}
                </div>
              ) : (
                <span className="qa-answer-pending">Pendiente de respuesta del vendedor</span>
              )}
            </article>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <nav className="qa-pagination" aria-label="Navegación de preguntas">
          <button
            className="button text-sm py-2 px-3"
            disabled={page <= 1 || loading}
            onClick={() => loadQuestions(page - 1)}
          >
            ← Anterior
          </button>
          <span className="text-sm muted">
            Página {page} de {totalPages}
          </span>
          <button
            className="button text-sm py-2 px-3"
            disabled={page >= totalPages || loading}
            onClick={() => loadQuestions(page + 1)}
          >
            Siguiente →
          </button>
        </nav>
      )}
    </section>
  );
}
