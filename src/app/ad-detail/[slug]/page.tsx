'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal'; // Import the Modal component
import PurchaseModal from '@/components/PurchaseModal';
import { Product } from '@/types';
import toast from 'react-hot-toast';
import SkeletonAdDetail from '@/components/SkeletonAdDetail';

interface Order {
  id: string;
  status: string;
}

interface SellerProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Question {
  id:string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
  user: {
    username: string | null;
  };
}

interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  user_id: string;
  user: {
    username: string;
  };
}

// Helper function to format time since an event
function timeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `hace ${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval > 1) return `hace ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `hace ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval > 1) return `hace ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
  return `hace ${Math.floor(seconds)} segundos`;
}

function timeRemaining(endDate: Date): string {
  const seconds = Math.floor((endDate.getTime() - new Date().getTime()) / 1000);
  if (seconds < 0) return "Finalizada";

  let interval = seconds / 86400;
  if (interval > 1) return `Quedan ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval > 1) return `Quedan ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `Quedan ${Math.floor(interval)} minutos`;
  return `Quedan ${Math.floor(seconds)} segundos`;
}

export default function AdDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal and actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '', onConfirm: () => {} });
  const [bidAmount, setBidAmount] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // State for Contact Seller Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  // State for Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // State for Q&A
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answerForms, setAnswerForms] = useState<{[key: string]: string}>({});
  
  // State for Bid History
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswerForms(prev => ({ ...prev, [questionId]: text }));
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!isOwner || !answerForms[questionId]?.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No autenticado');

      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ answer: answerForms[questionId] }),
      });

      if (response.ok) {
        const updatedQuestion = await response.json();
        setQuestions(prev => prev.map(q => q.id === questionId ? updatedQuestion : q));
        handleAnswerChange(questionId, ''); // Clear form
        toast.success('Respuesta enviada con éxito');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al enviar la respuesta');
      }
    } catch (err) {
      toast.error('Error al enviar la respuesta');
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!newQuestion.trim()) return;

    setQuestionLoading(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No estás autenticado. Por favor, inicia sesión.');
      }

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          product_id: product?.id, 
          question: newQuestion.trim() 
        }),
      });

      if (response.ok) {
        const newQuestionData = await response.json();
        setQuestions(prev => [newQuestionData, ...prev]);
        setNewQuestion('');
        toast.success('Pregunta enviada con éxito');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al enviar la pregunta');
      }
    } catch (error) {
      toast.error('Error al enviar la pregunta');
    } finally {
      setQuestionLoading(false);
    }
  };

  const fetchPageData = useCallback(async () => {
    if (!slug || authLoading) {
      // Don't fetch if slug is missing or auth is still loading
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch product by slug
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (productError || !productData) {
        console.error('Error fetching product:', productError);
        throw new Error('No se pudo encontrar el anuncio.');
      }

      setProduct(productData as Product);
      setBidAmount((productData.current_bid || productData.price + 1).toString());

      // Step 2: Fetch seller data
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', productData.user_id)
        .single();

      if (sellerError) {
        console.error("Error fetching seller's profile:", sellerError);
        // Not throwing an error here, as the product page can still be useful
      }
      setSeller(sellerData);
      setBidAmount((productData.current_bid || productData.price + 1).toString());

      // If the product has a buyer, fetch the associated order
      if (productData.buyer_id && (productData.status === 'pending_payment' || productData.status === 'sold')) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, status')
          .eq('product_id', productData.id)
          .eq('buyer_id', productData.buyer_id)
          .single();
        
        if (orderError) {
          console.error("Error fetching order:", orderError);
        } else {
          setOrder(orderData);
        }
      }

      // Fetch other related data like questions and bids
      const productId = productData.id;
      const [questionsResponse, bidsResult] = await Promise.all([
        fetch(`/api/questions?product_id=${productId}`),
        productData.type === 'auction' ? fetch(`/api/products/${productId}/bids`) : Promise.resolve(null)
      ]);

      // Handle questions data
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
      } else {
        console.error('Error fetching questions:', await questionsResponse.text());
      }

      // Handle bids data
      if (bidsResult && bidsResult.ok) {
        const bidsData = await bidsResult.json();
        setBidHistory(bidsData as Bid[]);
      } else if (bidsResult) {
        console.error('Error fetching bid history:', await bidsResult.text());
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, authLoading]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handlePlaceBid = async () => {
    const bid = parseFloat(bidAmount);
    if (isNaN(bid) || (product && bid <= product.price)) {
      toast.error(`Tu puja debe ser mayor que ${product?.price} €.`);
      return;
    }

    setModalContent({
      title: 'Confirmar Puja',
      body: `¿Estás seguro de que quieres pujar ${bid} € por este artículo?`,
      onConfirm: async () => {
        try {
          // Get the current session token
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('No estás autenticado. Por favor, inicia sesión.');
          }

          const response = await fetch('/api/bids', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ product_id: product?.id, bid_amount: bid }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Ocurrió un error al realizar la puja.');
          }
          
          // Update product and bid history state for real-time UI update
          setProduct(result.updatedProduct as Product);
          setBidHistory(prev => [result.newBid, ...prev]);
          
          setIsModalOpen(false);
          toast.success('¡Puja realizada con éxito!');
        } catch (err: any) {
          toast.error(err.message);
          setIsModalOpen(false);
        }
      },
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    setModalContent({
      title: 'Eliminar Anuncio',
      body: '¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', product?.id);

          if (error) {
            throw new Error(error.message);
          }

          // Redirect to user profile after successful deletion
          toast.success('Anuncio eliminado con éxito');
          router.push('/user-profile');
        } catch (err: any) {
          toast.error('Error al eliminar el anuncio: ' + err.message);
          setIsModalOpen(false);
        }
      },
    });
    setIsModalOpen(true);
  };

  if (loading || authLoading) {
    return <SkeletonAdDetail />;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Anuncio no encontrado.</div>;
  }

  const isOwner = user && product.user_id === user.id;

  const onBidButtonClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    handlePlaceBid();
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product) return;

    setModalContent({
      title: 'Confirmar Compra',
      body: `¿Estás seguro de que quieres comprar "${product.name}" por ${product.price} €?`,
      onConfirm: async () => {
        setActionError(null);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('No estás autenticado.');
          }

          const response = await fetch(`/api/products/${product.id}/buy`, {
            method: 'POST',
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || 'No se pudo completar la compra.');
          }

          setProduct(result as Product); // Update UI with the new product state
          setIsModalOpen(false);
          toast.success('¡Producto reservado! Finaliza la compra.');
          fetchPageData(); // Refresh data to show the new state

        } catch (err: any) {
          toast.error(err.message);
          setIsModalOpen(false);
        }
      },
    });
    setIsModalOpen(true);
  };

  const handleContactSeller = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim() || !user || !product || !seller) return;

    setContactLoading(true);
    setActionError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No autenticado');

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          receiver_id: seller.id,
          content: contactMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el mensaje');
      }

      setIsContactModalOpen(false);
      setContactMessage('');
      toast.success('Mensaje enviado con éxito.');

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setContactLoading(false);
    }
  };

  const handlePurchaseComplete = () => {
    fetchPageData(); // Refresh product data
  };

  const handlePay = async () => {
    if (!order) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/pay`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('No se pudo procesar el pago.');
      }

      toast.success('¡Pago procesado con éxito!');
      fetchPageData(); // Refresh data to show the new state

    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al procesar el pago.');
    }
  };

  return (
    <>
      {product && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          product={product}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={modalContent.onConfirm}
        title={modalContent.title}
      >
        <p>{modalContent.body}</p>
      </Modal>

      {/* Contact Seller Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Contactar con ${seller?.username || 'el vendedor'}`}
      >
        <form onSubmit={handleSendMessage}>
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Escribe tu mensaje para coordinar el pago y la entrega..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={contactLoading}
          />
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="mr-2 px-4 py-2 text-gray-600"
              disabled={contactLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={contactLoading || !contactMessage.trim()}
            >
              {contactLoading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Left Column: Image Gallery */}
          <div className="md:w-1/2 lg:w-3/5">
            <div className="w-full h-[300px] md:h-[500px] relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
              {product.image ? (
                <Image 
                  src={product.image} 
                  alt={`Imagen de ${product.name}`} 
                  fill
                  style={{ objectFit: 'contain' }}
                  className="hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-200">
                  <span className="text-gray-400 text-2xl md:text-4xl">Sin imagen</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Info and Actions */}
          <div className="md:w-1/2 lg:w-2/5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
            
            <div className="mt-4">
              <p className="text-2xl md:text-3xl text-gray-900 font-bold">{product.price} €</p>
              <p className="text-sm text-gray-500">{product.type === 'auction' ? 'Puja actual' : 'Precio Fijo'}</p>
            </div>

            {product.type === 'auction' && product.auction_ends_at && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-center">
                <p className="font-semibold">{timeRemaining(new Date(product.auction_ends_at))}</p>
                <p className="text-xs">Finaliza el {new Date(product.auction_ends_at).toLocaleString()}</p>
              </div>
            )}

            {/* Seller Card */}
            {seller && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-600">Vendido por</h3>
                <Link href={`/user-profile/${seller.username}`} className="flex items-center gap-4 mt-2 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="relative h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                    {seller.avatar_url ? (
                      <Image src={seller.avatar_url} alt={`Avatar de ${seller.username}`} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <span className="absolute text-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{seller.username}</p>
                    <p className="text-sm text-blue-600">Ver perfil</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Action Area */}
            <div className="mt-8">
              {/* VENDOR'S VIEW */}
              {isOwner && product.status !== 'available' && order && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-lg mb-2">Estado de la venta</h3>
                  <p>Comprado por: <span className="font-bold">{product.buyer?.username || 'un usuario'}</span></p>
                  <p>Estado: <span className="font-bold">{order.status}</span></p>
                </div>
              )}

              {/* BUYER'S VIEW */}
              {!isOwner && product.buyer_id === user?.id && order && (
                <div className="space-y-4">
                  {order.status === 'pending_payment' && (
                     <button 
                      onClick={() => setIsPurchaseModalOpen(true)}
                      className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Finalizar Compra (Añadir dirección)
                    </button>
                  )}
                   {order.status === 'pending_shipping' && (
                    <>
                      <p className="text-center font-semibold bg-blue-100 text-blue-800 p-3 rounded-lg">Dirección enviada. Pendiente de pago.</p>
                      <button 
                        onClick={handlePay}
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Pagar ahora
                      </button>
                    </>
                  )}
                  {order.status === 'shipped' && (
                     <div className="space-y-4">
                      <p className="text-center font-semibold bg-green-100 text-green-800 p-3 rounded-lg">¡Producto pagado!</p>
                      <button 
                        onClick={handleContactSeller}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Contactar con el Vendedor
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PUBLIC/LOGGED-OUT VIEW */}
              {product.status === 'available' && !isOwner && (
                 <button 
                    onClick={handleBuyNow}
                    className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Comprar ahora
                  </button>
              )}
              
              {(product.status !== 'available' && product.buyer_id !== user?.id) && (
                <div className="text-center font-semibold bg-red-100 text-red-800 p-3 rounded-lg">
                  Este producto ya no está disponible.
                </div>
              )}

              {actionError && <p className="text-red-600 text-sm mt-2">{actionError}</p>}
            </div>

            {isOwner && product.status === 'available' && (
              <div className="mt-8 flex gap-4">
                <Link href={`/edit-ad/${product.id}`} className="flex-1 text-center bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                  Editar Anuncio
                </Link>
                <button onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors">
                  Eliminar Anuncio
                </button>
              </div>
            )}

            {/* Description */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800">Descripción</h3>
              <p className="mt-2 text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Bid History Section */}
        {product.type === 'auction' && (
          <section className="bid-history mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Historial de Pujas ({bidHistory.length})</h2>
            {bidHistory.length > 0 ? (
              <ul className="space-y-4">
                {bidHistory.map((bid) => (
                  <li key={bid.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Link href={`/user-profile/${bid.user_id}`} className="font-semibold text-indigo-600 hover:underline">
                        {bid.user.username}
                      </Link>
                      <p className="text-sm text-gray-500">{timeSince(new Date(bid.created_at))}</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{bid.bid_amount} €</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-gray-500">
                Aún no se han realizado pujas. ¡Sé el primero!
              </p>
            )}
          </section>
        )}

        {/* Q&A Section */}
        <section className="q-and-a mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Preguntas y Respuestas</h2>
          
          {/* Questions List */}
          <div className="q-list space-y-6">
            {questions.length > 0 ? (
              questions.map((q) => (
                <div key={q.id} className="q-item">
                  <p className="question font-semibold">
                    <b>P:</b> {q.question}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Por {q.user.username || 'Usuario'} • {new Date(q.created_at).toLocaleDateString()}
                  </p>
                  {q.answer ? (
                    <p className="answer mt-2 pl-4">
                      <b>R:</b> {q.answer}
                    </p>
                  ) : isOwner ? (
                    <div className="answer-form mt-3 pl-4">
                      <textarea
                        placeholder="Escribe tu respuesta..."
                        rows={2}
                        value={answerForms[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <button
                        onClick={() => handleAnswerSubmit(q.id)}
                        disabled={!answerForms[q.id]?.trim()}
                        className="mt-2 bg-gray-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        Responder
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2 italic pl-4">
                      Pendiente de respuesta
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-gray-500">
                Aún no hay preguntas para este producto. ¡Sé el primero en preguntar!
              </p>
            )}
          </div>

          {/* Question Form */}
          {!isOwner && (
            <div className="q-form mt-8">
              <h3 className="text-xl font-semibold mb-3">Haz una pregunta</h3>
              <form onSubmit={handleSubmitQuestion}>
              <textarea 
                placeholder="Escribe tu pregunta..." 
                rows={4}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={questionLoading}
              />
              <button 
                type="submit" 
                disabled={questionLoading || !newQuestion.trim()}
                className="mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {questionLoading ? 'Enviando...' : 'Enviar Pregunta'}
              </button>
            </form>
            {!user && (
              <p className="text-sm text-gray-500 mt-2">
                <Link href="/login" className="text-indigo-600 hover:underline">
                  Inicia sesión
                </Link> para hacer una pregunta.
              </p>
            )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
