import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Info } from 'lucide-react';
import api from '../services/api';
import useSocketStore from '../../../store/socketStore';

const TailorOrderChat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket } = useSocketStore();
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchChatAndOrder = async () => {
            try {
                // Fetch Order Details first to verify access
                const orderRes = await api.get(`/orders/${id}`);
                if (orderRes.data.success) {
                    setOrder(orderRes.data.data);
                }

                // Fetch Chat History
                const chatRes = await api.get(`/orders/${id}/chat`);
                if (chatRes.data.success) {
                    setMessages(chatRes.data.data);
                }
            } catch (err) {
                if (err.name === 'CanceledError' || err.message === 'canceled') return;
                console.error("Error fetching chat:", err);
                setError(err.response?.data?.message || "Failed to load chat.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchChatAndOrder();

        if (socket) {
            const handleNewMessage = (msg) => {
                if (msg.order === id || msg.order?._id === id) {
                    setMessages(prev => {
                        if (prev.find(m => m._id === msg._id)) return prev;
                        return [...prev, msg];
                    });
                }
            };

            socket.emit('join_order_room', id);
            
            socket.on('new_chat_message', handleNewMessage);
            return () => {
                socket.off('new_chat_message', handleNewMessage);
            };
        }
    }, [id, socket]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await api.post(`/orders/${id}/chat`, { message: newMessage });
            if (res.data.success) {
                setNewMessage('');
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            alert(err.response?.data?.message || "Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary mb-4" />
                <p className="text-gray-500 font-medium">Loading chat...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 p-6 rounded-3xl text-center border border-red-100 max-w-sm">
                    <Info size={48} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-black text-red-900 mb-2">Access Denied</h2>
                    <p className="text-xs text-red-700">{error}</p>
                    <button 
                        onClick={() => navigate('/partner/orders')}
                        className="mt-6 px-6 py-2 bg-white text-red-700 rounded-full text-xs font-bold shadow-sm border border-red-200 active:scale-95 transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#FDFBF7] font-sans relative">
            {/* Background Pattern (Optional subtle touch) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#843D9B 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 pt-6 pb-4 flex items-center gap-4 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.05)]">
                <button onClick={() => navigate('/partner/orders')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors">
                    <ArrowLeft size={22} />
                </button>
                <div className="flex-1">
                    <h1 className="text-base font-black text-gray-900 leading-tight">Chat with Customer</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-widest">
                            {order?.orderId}
                        </p>
                    </div>
                </div>
                {order?.customer && (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-50 flex items-center justify-center text-primary font-black overflow-hidden ring-2 ring-white shadow-md shrink-0">
                        {order.customer.profileImage ? (
                            <img src={order.customer.profileImage} alt="Customer" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg">{(order.customer.name || 'C')[0]}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 z-10">
                <div className="text-center py-4">
                    <span className="text-[10px] bg-white/60 backdrop-blur-sm text-gray-500 border border-gray-100 px-4 py-1.5 rounded-full font-bold tracking-widest uppercase shadow-sm">Chat Started</span>
                </div>
                
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-3 opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Info size={28} className="text-gray-400" />
                        </div>
                        <p className="text-xs font-semibold">Say hello to your customer!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderModel === 'Tailor';
                        return (
                            <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm relative ${
                                    isMe 
                                        ? 'bg-gradient-to-br from-[#843D9B] to-[#6a317c] text-white rounded-br-sm shadow-primary/20' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-gray-200/50'
                                }`}>
                                    <p className="text-[15px] leading-relaxed break-words">{msg.message}</p>
                                    <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'justify-end text-white/70' : 'justify-start text-gray-400'}`}>
                                        <span className="font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100 p-3 pb-safe z-10 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-gray-50/80 border border-gray-200 rounded-full py-3.5 pl-5 pr-14 text-[15px] outline-none focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shrink-0 ${
                            newMessage.trim() && !isSending 
                                ? 'bg-gradient-to-br from-primary to-[#6a317c] hover:shadow-lg hover:shadow-primary/30 active:scale-95' 
                                : 'bg-gray-300'
                        }`}
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TailorOrderChat;
