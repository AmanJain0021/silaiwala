import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../utils/api';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/support/admin');
            setTickets(res.data.data);
        } catch (error) {
            console.error('Failed to fetch support tickets', error);
            toast.error('Failed to fetch support tickets');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/support/admin/${id}/status`, { status: newStatus });
            toast.success(`Ticket marked as ${newStatus}`);
            fetchTickets();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const deleteTicket = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            await api.delete(`/support/admin/${id}`);
            toast.success('Ticket deleted');
            fetchTickets();
        } catch (error) {
            toast.error('Failed to delete ticket');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
        const searchRegex = new RegExp(searchTerm, 'i');
        const matchesSearch = searchRegex.test(ticket.name) || searchRegex.test(ticket.email) || searchRegex.test(ticket.subject);
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Support Inquiries</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage and resolve customer support messages</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl">
                    <span className="text-xs font-black">{tickets.filter(t => t.status === 'Pending').length} Pending</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or subject..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={16} className="text-gray-400" />
                    <select 
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-primary transition-colors appearance-none"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6 relative">
                {isLoading ? (
                    <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                        <div className="h-full bg-primary animate-pulse w-1/3"></div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-20">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No Inquiries Found</h3>
                        <p className="text-sm text-gray-500 mt-1">There are no support tickets matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTickets.map(ticket => (
                            <div key={ticket._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(ticket.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                                        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-4 rounded-xl whitespace-pre-wrap">{ticket.message}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="font-bold text-gray-900">{ticket.name}</span>
                                            <span className="text-gray-300">•</span>
                                            <a href={`mailto:${ticket.email}`} className="text-primary hover:underline">{ticket.email}</a>
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                                        {ticket.status !== 'Resolved' && (
                                            <button 
                                                onClick={() => updateStatus(ticket._id, 'Resolved')}
                                                className="w-full py-2 bg-green-50 text-green-700 text-xs font-black rounded-xl hover:bg-green-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 border border-green-200"
                                            >
                                                <CheckCircle size={14} /> Resolve
                                            </button>
                                        )}
                                        {ticket.status === 'Pending' && (
                                            <button 
                                                onClick={() => updateStatus(ticket._id, 'In Progress')}
                                                className="w-full py-2 bg-blue-50 text-blue-700 text-xs font-black rounded-xl hover:bg-blue-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 border border-blue-200"
                                            >
                                                In Progress
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => deleteTicket(ticket._id)}
                                            className="w-full py-2 bg-white text-red-500 text-xs font-black rounded-xl hover:bg-red-50 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 border border-red-200"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
