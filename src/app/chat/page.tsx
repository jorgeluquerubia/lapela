'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Conversation {
  product_id: string;
  product_name: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // This is a complex query. We'll use an RPC call for this.
        // For now, we'll just simulate the data.
        // In the future, we would create a database function `get_user_conversations`.
        const { data, error: rpcError } = await supabase.rpc('get_conversations_for_user', { user_id_param: user.id });

        if (rpcError) {
          throw rpcError;
        }
        
        setConversations(data as Conversation[]);

      } catch (err: any) {
        console.error("Error fetching conversations:", err);
        setError("No se pudieron cargar las conversaciones.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchConversations();
    }
  }, [user, authLoading]);

  if (loading || authLoading) {
    return <div className="text-center py-10">Cargando conversaciones...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Mis Mensajes</h1>
      
      {conversations.length === 0 ? (
        <p className="text-center text-gray-500">No tienes ninguna conversación activa.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((convo) => (
            <Link key={`${convo.product_id}-${convo.other_user_id}`} href={`/chat/${convo.product_id}?with=${convo.other_user_id}`}>
              <a className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">{convo.product_name}</p>
                    <p className="text-sm text-gray-600">Conversación con {convo.other_user_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-800 truncate">{convo.last_message}</p>
                    <p className="text-xs text-gray-400">{new Date(convo.last_message_at).toLocaleString()}</p>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
