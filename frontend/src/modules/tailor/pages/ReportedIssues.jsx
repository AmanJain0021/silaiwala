import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../../modules/tailor/services/api'; // Tailor has a specific api file
import { toast } from 'react-hot-toast';

const ReportedIssues = () => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await api.get('/issues/tailor/list');
            setIssues(res.data.data);
        } catch (err) {
            toast.error("Failed to load reported issues");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full active:scale-95">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-black tracking-tight uppercase text-gray-900">Reported Issues</h1>
            </div>

            <div className="p-4 space-y-4">
                {issues.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                        <h2 className="text-lg font-black uppercase tracking-wider mb-2">No Issues Reported</h2>
                        <p className="text-xs font-medium">You don't have any reported stitching issues.</p>
                    </div>
                ) : (
                    issues.map(issue => (
                        <div 
                            key={issue._id} 
                            onClick={() => navigate(`/partner/issues/${issue._id}`)}
                            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        {issue.issueId ? `${issue.issueId} • ` : ''}Order {issue.originalOrder?.orderId}
                                    </p>
                                    <h3 className="text-sm font-black text-gray-900 uppercase truncate pr-4">
                                        {issue.customer?.name}
                                    </h3>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                    issue.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    issue.status === 'accepted' || issue.status === 'pickup_pending' ? 'bg-blue-100 text-blue-700' :
                                    issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {issue.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            
                            <p className="text-xs font-medium text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                {issue.description}
                            </p>

                            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                <span className="text-[10px] font-bold text-gray-400">
                                    {new Date(issue.createdAt).toLocaleDateString()}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                    <ChevronRight size={14} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReportedIssues;
