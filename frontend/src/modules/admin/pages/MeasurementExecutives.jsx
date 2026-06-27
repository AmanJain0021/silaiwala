import React, { useEffect, useState } from 'react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { User, CheckCircle, XCircle, MapPin, Search } from 'lucide-react';

const MeasurementExecutives = () => {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchExecutives();
    }, [filter]);

    const fetchExecutives = async () => {
        setLoading(true);
        try {
            const endpoint = filter === 'all' 
                ? '/measurement-executive/admin/executives' 
                : `/measurement-executive/admin/executives?status=${filter}`;
            
            const res = await api.get(endpoint);
            setExecutives(res.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError') return;
            toast.error('Failed to fetch executives');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/measurement-executive/admin/executives/${id}/status`, { verificationStatus: status });
            toast.success(`Executive ${status} successfully`);
            fetchExecutives();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Measurement Executives</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage, approve, and verify at-home tailors.</p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending Approval</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : executives.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500 border border-gray-200">
                    No measurement executives found.
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {executives.map((exec) => (
                            <li key={exec._id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                {exec.user?.name?.charAt(0) || <User className="h-5 w-5" />}
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{exec.user?.name}</p>
                                                <div className="flex text-sm text-gray-500">
                                                    <p className="truncate">{exec.user?.email} • {exec.user?.phoneNumber}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                                ${exec.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                                                  exec.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {exec.verificationStatus}
                                            </span>
                                            <div className="mt-2 flex text-xs text-gray-500">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                Radius: {exec.serviceRadius}km
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {exec.verificationStatus === 'pending' && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleUpdateStatus(exec._id, 'rejected')}
                                                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <XCircle className="h-4 w-4 mr-1.5" /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(exec._id, 'verified')}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MeasurementExecutives;
