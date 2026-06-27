import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';
import useSocketStore from '../../../store/socketStore';

const IssueDetails = () => {
    const { issueId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const socket = useSocketStore(state => state.socket);
    
    const [issue, setIssue] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchIssueDetails();
        fetchMessages();
    }, [issueId]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_issue_room', issueId);
        
        socket.on('receive_issue_message', (msg) => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        });

        return () => {
            socket.emit('leave_issue_room', issueId);
            socket.off('receive_issue_message');
        };
    }, [socket, issueId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const fetchIssueDetails = async () => {
        try {
            const res = await api.get(`/issues/${issueId}`);
            setIssue(res.data.data);
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            toast.error("Failed to load issue details");
            navigate(-1);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/issues/${issueId}/chat`);
            setMessages(res.data.data);
            scrollToBottom();
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            console.error(err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            await api.post(`/issues/${issueId}/chat`, {
                message: newMessage
            });
            setNewMessage('');
        } catch (err) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) return <div className="flex h-[100dvh] items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;
    if (!issue) return null;

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-50">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-900 active:scale-95 transition-transform">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                        {issue.issueId ? `${issue.issueId} - ` : ''}{issue.tailor?.shopName || 'Tailor'}
                    </h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Status: <span className="text-primary">{issue.status.replace(/_/g, ' ')}</span>
                    </p>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Issue Details Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Your Report</h3>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">{issue.description}</p>
                    {issue.images?.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto mt-4 pb-2 snap-x">
                            {issue.images.map((img, i) => (
                                <img key={i} src={img} alt="Issue" className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shrink-0 shadow-sm snap-center" />
                            ))}
                        </div>
                    )}
                    {issue.rejectionReason && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-red-900 mb-1">Rejected by Tailor</p>
                                <p className="text-xs font-medium text-red-700 leading-relaxed">{issue.rejectionReason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2 opacity-50">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conversation</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {/* Chat Area */}
                {messages.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm font-bold">No messages yet</p>
                        <p className="text-xs font-medium mt-1">Reply below to start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${isMe ? 'bg-primary text-white rounded-br-sm shadow-primary/10' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="attachment" className="w-full h-auto rounded-xl mb-3" />
                                    )}
                                    {msg.message && <p className="text-[13px] font-medium leading-relaxed">{msg.message}</p>}
                                    <p className={`text-[9px] font-bold mt-2 tracking-wider uppercase ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* MESSAGE INPUT */}
            {(issue.status !== 'resolved' && issue.status !== 'closed' && issue.status !== 'rejected') && (
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-full px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !newMessage.trim()}
                            className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-full shrink-0 disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                        >
                            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default IssueDetails;
