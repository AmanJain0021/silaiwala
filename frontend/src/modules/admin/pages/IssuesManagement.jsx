import React, { useState, useEffect } from 'react';
import { AlertTriangle, MessageSquare, Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const IssuesManagement = () => {
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await api.get('/issues/admin/list');
            setIssues(res.data.data);
        } catch (err) {
            toast.error("Failed to load issues");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceResolve = async (issueId) => {
        if (!window.confirm("Force resolve this issue? This will close it without further action.")) return;
        
        try {
            await api.patch(`/issues/admin/${issueId}/status`, { status: 'resolved' });
            toast.success("Issue forcefully resolved");
            fetchIssues();
        } catch (err) {
            toast.error("Failed to update issue status");
        }
    };

    const filteredIssues = issues.filter(issue => 
        issue.originalOrder?.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.tailor?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Stitching Issues</h1>
                    <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">Monitor and manage reported problems</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 max-w-md relative">
                        <input
                            type="text"
                            placeholder="Search by Issue ID, Order ID, Customer, or Tailor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        />
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Issue Date</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Issue ID</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Tailor</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIssues.map((issue) => (
                                    <tr key={issue._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 text-xs font-bold text-gray-900">{new Date(issue.createdAt).toLocaleDateString()}</td>
                                        <td className="py-4 text-xs font-black text-gray-900 uppercase">{issue.issueId || 'N/A'}</td>
                                        <td className="py-4 text-xs font-black text-primary uppercase">{issue.originalOrder?.orderId}</td>
                                        <td className="py-4 text-xs font-medium text-gray-700">{issue.customer?.name}</td>
                                        <td className="py-4 text-xs font-medium text-gray-700">{issue.tailor?.shopName}</td>
                                        <td className="py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                issue.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                issue.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {issue.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="py-4 flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => window.open(`/partner/issues/${issue._id}`, '_blank')}
                                                className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                                                title="View Chat"
                                            >
                                                <MessageSquare size={14} />
                                            </button>
                                            {issue.status !== 'resolved' && issue.status !== 'closed' && (
                                                <button 
                                                    onClick={() => handleForceResolve(issue._id)}
                                                    className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 active:scale-95 transition-all"
                                                    title="Force Resolve"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredIssues.length === 0 && (
                            <div className="py-12 text-center text-gray-500 font-medium text-sm">
                                No issues found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssuesManagement;
