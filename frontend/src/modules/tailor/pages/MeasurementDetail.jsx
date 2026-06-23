import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Edit3, Ruler, Plus, Info, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useTailorAuth } from '../context/AuthContext';

const MeasurementDetail = ({ orderId, inline = false }) => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const id = orderId || paramId;
    const { user } = useTailorAuth();

    const [activeTab, setActiveTab] = useState('Top');
    const [profile, setProfile] = useState(null);
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const tabs = ['Top', 'Bottom', 'General'];

    const fetchProfileDetail = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/tailors/orders/${id}/measurement-report`);
            if (response.data.success) {
                setProfile(response.data.data.report);
                setOrder(response.data.data.order);
                setEditData(response.data.data.report?.formData || {});
            }
        } catch (error) {
            console.error('Error fetching measurement details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProfileDetail();
        }
    }, [id]);

    const defaultMetrics = [
        { label: 'Chest', key: 'chest', value: '0.0' },
        { label: 'Waist', key: 'waist', value: '0.0' },
        { label: 'Hips', key: 'hips', value: '0.0' },
        { label: 'Shoulder', key: 'shoulder', value: '0.0' },
        { label: 'Length', key: 'length', value: '0.0' },
        { label: 'Neck', key: 'neck', value: '0.0' },
        { label: 'Sleeve', key: 'sleeve', value: '0.0' },
        { label: 'Inseam', key: 'inseam', value: '0.0' }
    ];

    const sourceData = profile?.formData || {};
    
    // Always render the default metrics in a standard order
    let currentMetrics = defaultMetrics.map(m => {
        let val = isEditing ? editData[m.key] : sourceData[m.key];
        // Special case: if they saved 'hip' instead of 'hips', map it correctly
        if (m.key === 'hips' && !val && (isEditing ? editData['hip'] : sourceData['hip'])) {
            val = isEditing ? editData['hip'] : sourceData['hip'];
        }
        return { ...m, value: String(val || '0.0') };
    });

    // Also include any extra custom fields
    const dataToCheck = isEditing ? editData : sourceData;
    Object.keys(dataToCheck).forEach(key => {
        if (key.toLowerCase() !== 'hip' && !defaultMetrics.find(m => m.key === key)) {
            currentMetrics.push({
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                key: key,
                value: String(dataToCheck[key] || '0.0')
            });
        }
    });

    const finalProfile = {
        name: order?.customer?.name || 'Customer',
        clientId: `#ORD-${id?.substring(0, 4).toUpperCase()}`,
        tags: ['Client'],
        topMetrics: currentMetrics,
        notes: profile?.notes || 'No notes provided',
        images: profile?.photos || [],
        pdfUrl: profile?.pdfUrl || null,
        executive: profile?.executive || null,
        updatedAt: profile?.updatedAt || null
    };

    // Use first metric as the featured main card
    const featuredMetric = finalProfile.topMetrics[0] || { label: 'Metric', value: '0.0' };
    const gridMetrics = finalProfile.topMetrics.slice(1, 5);
    const rowMetrics = finalProfile.topMetrics.slice(5);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await api.put(`/tailors/orders/${id}/measurement-report`, { measurements: editData });
            if (res.data.success) {
                setProfile(res.data.data);
                setIsEditing(false);
                alert('Measurements updated successfully');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to update measurements');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={inline ? "w-full" : "min-h-screen bg-[#F5F5F5] pb-24 flex flex-col pt-0"}>

            <div className={`flex-1 space-y-3.5 w-full ${inline ? '' : 'px-4 py-3 max-w-md mx-auto'}`}>
                
                {/* Back Button */}
                {!inline && (
                    <div className="flex items-center gap-2.5 mb-1">
                        <button onClick={() => navigate('/partner/measurements')} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-600 shadow-sm hover:text-[#843D9B] transition-all">
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Back to Profiles</span>
                    </div>
                )}

                {/* Customer Profile Card */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-700 text-xl">
                            {finalProfile.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-[16px] font-black text-gray-900 leading-none">{finalProfile.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">ID: {finalProfile.clientId}</p>
                            <div className="flex gap-1 mt-2">
                                {finalProfile.tags.map((tag, idx) => (
                                    <span key={idx} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${idx === 1 ? 'bg-red-50 text-[#843D9B]' : 'bg-blue-50 text-blue-600'}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {(order?.status === 'measurement-revision-required' || order?.status === 'measurements-uploaded' || order?.status === 'measurement-verification' || order?.status === 'pending') && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="w-9 h-9 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center border border-gray-100 active:scale-90 transition-all hover:bg-gray-100 hover:text-gray-900">
                            <Edit3 size={16} />
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 bg-[#843D9B] text-white text-[10px] font-black uppercase rounded-lg active:scale-95 transition-all shadow-sm">
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>

                {/* Tabs Row */}
                <div className="bg-gray-200/40 rounded-xl p-0.5 flex gap-0.5">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${
                                activeTab === tab
                                    ? 'bg-white text-[#843D9B] shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Red Card (Featured Metric) */}
                <div className="bg-[#A02844] rounded-2xl p-4.5 text-white relative shadow-md">
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-10">
                        <Ruler size={60} color="white" />
                    </div>
                    <p className="text-[10px] text-white/70 font-bold tracking-wide uppercase">{featuredMetric.label}</p>
                    <p className="text-[32px] font-black tracking-tight leading-none mt-1.5">
                        {featuredMetric.value} <span className="text-[14px] font-medium opacity-80">inch</span>
                    </p>
                </div>

                {/* Sub-metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                    {gridMetrics.map((m, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{m.label}</p>
                            {isEditing ? (
                                <input
                                    type="number"
                                    step="0.1"
                                    value={editData[m.key] || ''}
                                    onChange={(e) => setEditData({...editData, [m.key]: e.target.value})}
                                    className="w-full mt-1 text-[16px] font-black text-gray-900 border-b border-gray-200 focus:border-[#843D9B] outline-none"
                                />
                            ) : (
                                <p className="text-[16px] font-black text-gray-900 mt-1 leading-none">
                                    {m.value} <span className="text-[9px] font-bold text-gray-400">in</span>
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Row Metrics (additional) */}
                <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {rowMetrics.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5 px-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-blue-50/50 rounded-lg flex items-center justify-center text-blue-500">
                                    <Ruler size={14} />
                                </div>
                                <span className="text-[12px] font-bold text-gray-800">{m.label}</span>
                            </div>
                            {isEditing ? (
                                <input
                                    type="number"
                                    step="0.1"
                                    value={editData[m.key] || ''}
                                    onChange={(e) => setEditData({...editData, [m.key]: e.target.value})}
                                    className="w-20 text-right text-[13px] font-black text-gray-900 border-b border-gray-200 focus:border-[#843D9B] outline-none"
                                />
                            ) : (
                                <span className="text-[13px] font-black text-gray-900">{m.value} in</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Notes and Images */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mt-3">
                    <h4 className="text-[12px] font-black text-gray-900 mb-2 uppercase">Executive Notes</h4>
                    <p className="text-[12px] text-gray-600">{finalProfile.notes}</p>
                    
                    {finalProfile.pdfUrl && (
                        <div className="mt-4">
                            <h4 className="text-[12px] font-black text-gray-900 mb-2 uppercase">Measurement Report (PDF)</h4>
                            <a href={finalProfile.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border-2 border-indigo-100 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="p-2 bg-indigo-200 rounded-lg text-indigo-600">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-900 truncate">View PDF Document</span>
                                </div>
                            </a>
                        </div>
                    )}

                    {finalProfile.images && finalProfile.images.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-[12px] font-black text-gray-900 mb-2 uppercase">Reference Images</h4>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {finalProfile.images.map((img, idx) => (
                                    <img key={idx} src={img} alt={`Ref ${idx}`} className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {['measurements-uploaded', 'measurement-revision-required'].includes(order?.status) && !isEditing && (
                    <button 
                        onClick={async () => {
                            try {
                                const res = await api.post(`/tailors/orders/${id}/send-measurement-confirmation`);
                                if (res.data.success) {
                                    setOrder(res.data.data);
                                    alert('Sent for confirmation successfully');
                                    if (window.location.pathname.includes('/orders')) {
                                        window.location.reload();
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                                alert('Failed to send confirmation');
                            }
                        }}
                        className="w-full py-3.5 bg-[#843D9B] rounded-2xl text-[12px] font-black uppercase text-white shadow-lg shadow-[#843D9B]/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Check size={16} strokeWidth={3} /> {order?.status === 'measurement-revision-required' ? 'Re-send For Customer Confirmation' : 'Send For Customer Confirmation'}
                    </button>
                )}

                {/* Footer Banner */}
                <div className="bg-[#EBF1FF] text-[#1D4ED8] p-4 rounded-3xl flex items-start gap-3 border border-[#BFDBFE]/50 mt-2">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-relaxed">
                        Measurements were last updated on {finalProfile.updatedAt ? new Date(finalProfile.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} by Measurement Executive {finalProfile.executive ? finalProfile.executive.name : 'Unknown'}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MeasurementDetail;
