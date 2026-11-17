// Port of modules/tailor/pages/TailorOrderChat.jsx (converted with scripts/web2rn.js, then reviewed)
import { alert } from '../lib/alert';
import Screen from '../components/common/Screen';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from '../lib/nav';
import { ArrowLeft, Send, Loader2, Info } from "lucide-react-native";
import api from "../lib/api";
import useSocketStore from "../store/socketStore";
import { Box, Txt, I, Btn, Img, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const TailorOrderChat = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    socket
  } = useSocketStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
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
      const handleNewMessage = msg => {
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
  const handleSendMessage = async e => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await api.post(`/orders/${id}/chat`, {
        message: newMessage
      });
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
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center">
                <Spin size={32} className="animate-spin text-primary mb-4" />
                <Txt className="text-gray-500 font-medium">Loading chat...</Txt>
            </Box></Screen>;
  }
  if (error) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-4">
                <Box className="bg-red-50 p-6 rounded-3xl text-center border border-red-100 max-w-sm">
                    <I icon={Info} size={48} className="text-red-400 mx-auto mb-4" />
                    <Txt className="text-lg font-black text-red-900 mb-2">Access Denied</Txt>
                    <Txt className="text-xs text-red-700">{error}</Txt>
                    <Btn onPress={() => navigate('/partner/orders')} className="mt-6 px-6 py-2 bg-white text-red-700 rounded-full text-xs font-bold shadow-sm border border-red-200 active:scale-95 transition-all">
                        Go Back
                    </Btn>
                </Box>
            </Box></Screen>;
  }
  return <Screen className="bg-[#FDFBF7]"><Box className="flex flex-col flex-1 bg-[#FDFBF7] font-sans relative">
            {/* Background Pattern (Optional subtle touch) */}
            <Box className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
      backgroundImage: 'radial-gradient(#843D9B 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}></Box>
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 pt-6 pb-4 flex items-center gap-4 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.05)]">
                <Btn onPress={() => navigate('/partner/orders')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors">
                    <I icon={ArrowLeft} size={22} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-base font-black text-gray-900 leading-tight">Chat with Customer</Txt>
                    <Box className="flex items-center gap-1.5 mt-0.5">
                        <Txt className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></Txt>
                        <Txt className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-widest">
                            {order?.orderId}
                        </Txt>
                    </Box>
                </Box>
                {order?.customer && <Box className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-50 flex items-center justify-center text-primary font-black overflow-hidden ring-2 ring-white shadow-md shrink-0">
                        {order.customer.profileImage ? <Img src={order.customer.profileImage} alt="Customer" className="w-full h-full object-cover" /> : <Txt className="text-lg">{(order.customer.name || 'C')[0]}</Txt>}
                    </Box>}
            </Box>

            {/* Chat Area */}
            <Scroll ref={messagesEndRef} onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: false })} contentClassName="p-4 space-y-5" className="flex-1 z-10" nestedScrollEnabled>
                <Box className="text-center py-4">
                    <Txt className="text-[10px] bg-white/60 backdrop-blur-sm text-gray-500 border border-gray-100 px-4 py-1.5 rounded-full font-bold tracking-widest uppercase shadow-sm">Chat Started</Txt>
                </Box>
                
                {messages.length === 0 ? <Box className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-3 opacity-60">
                        <Box className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <I icon={Info} size={28} className="text-gray-400" />
                        </Box>
                        <Txt className="text-xs font-semibold">Say hello to your customer!</Txt>
                    </Box> : messages.map((msg, index) => {
        const isMe = msg.senderModel === 'Tailor';
        return <Box key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <Box className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm relative ${isMe ? 'bg-gradient-to-br from-[#843D9B] to-[#6a317c] text-white rounded-br-sm shadow-primary/20' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-gray-200/50'}`}>
                                    <Txt className="text-[15px] leading-relaxed break-words">{msg.message}</Txt>
                                    <Box className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'justify-end text-white/70' : 'justify-start text-gray-400'}`}>
                                        <Txt className="font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</Txt>
                                    </Box>
                                </Box>
                            </Box>;
      })}
                <Box className="h-2" />
            </Scroll>

            {/* Input Area */}
            <Box className="bg-white/80 backdrop-blur-xl border-t border-gray-100 p-3 pb-safe z-10 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.05)]">
                <Box className="flex items-center gap-2 relative max-w-3xl mx-auto">
                    <Input value={newMessage} onChangeText={e => setNewMessage(e)} placeholder="Message..." className="flex-1 bg-gray-50/80 border border-gray-200 rounded-full py-3.5 pl-5 pr-14 text-[15px] outline-none focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" />
                    <Btn disabled={!newMessage.trim() || isSending} className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shrink-0 ${newMessage.trim() && !isSending ? 'bg-gradient-to-br from-primary to-[#6a317c] hover:shadow-lg hover:shadow-primary/30 active:scale-95' : 'bg-gray-300'}`}>
                        {isSending ? <Spin size={18} className="animate-spin" /> : <I icon={Send} size={18} className="ml-0.5" />}
                    </Btn>
                </Box>
            </Box>
        </Box></Screen>;
};
export default TailorOrderChat;
