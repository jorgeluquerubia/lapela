'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  content: string;
  created_at: string;
}

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const productId = params.productId as string;
  const otherUserId = searchParams.get('with');

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !productId || !otherUserId) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('product_id', productId)
          .in('sender_id', [user.id, otherUserId])
          .in('receiver_id', [user.id, otherUserId])
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setMessages(data || []);
      } catch (err: any) {
        console.error("Error fetching messages:", err);
        setError("No se pudieron cargar los mensajes.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchMessages();
    }
  }, [user, authLoading, productId, otherUserId]);

  // Real-time subscription to new messages
  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`messages:${productId}:${user?.id}:${otherUserId}`)
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Basic check to see if the new message belongs to this conversation
          const msg = payload.new;
          if (msg.product_id === productId && 
             ((msg.sender_id === user?.id && msg.receiver_id === otherUserId) || 
              (msg.sender_id === otherUserId && msg.receiver_id === user?.id))) {
            setMessages((prevMessages) => [...prevMessages, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, user, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !productId || !otherUserId) return;

    const content = newMessage.trim();
    setNewMessage('');

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
                product_id: productId,
                receiver_id: otherUserId,
                content: content,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al enviar el mensaje');
        }
    } catch (err: any) {
        console.error(err);
        // Optionally, add the message back to the input to allow resending
        setNewMessage(content);
        setError(err.message);
    }
  };

  if (loading || authLoading) {
    return <div className="text-center py-10">Cargando mensajes...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 flex flex-col h-[calc(100vh-120px)]">
      <div className="border-b pb-4 mb-4">
        <Link href="/chat" className="text-blue-600 hover:underline">&larr; Volver a todas las conversaciones</Link>
        <h1 className="text-2xl font-bold mt-2">Chat</h1>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${
                msg.sender_id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'} text-right`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white font-bold px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
