import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, X, Zap, Star, Users, Calendar, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../tailor/services/api'; // Using existing API service

const AdminSubscriptions = () => {
    const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'subscribers'
    const [plans, setPlans] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        billingCycle: 'Monthly',
        commissionRange: '',
        features: '',
        isPopular: false,
        theme: 'basic',
        isActive: true,
        maxOrdersPerMonth: -1,
        sortOrder: 0,
        description: '',
        audience: 'tailor',
        pointsPrice: 0,
        durationDays: 30,
    });

    useEffect(() => {
        fetchPlans();
        fetchSubscribers();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/subscriptions/admin');
            if (res.data.success) {
                setPlans(res.data.data);
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubscribers = useCallback(async () => {
        setIsLoadingSubscribers(true);
        try {
            const res = await api.get('/subscriptions/admin/subscribers');
            if (res.data.success) {
                setSubscribers(res.data.data || []);
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Error fetching subscribers:', error);
        } finally {
            setIsLoadingSubscribers(false);
        }
    }, []);

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price,
                billingCycle: plan.billingCycle,
                commissionRange: plan.commissionRange,
                features: plan.features.join(', '),
                isPopular: plan.isPopular,
                theme: plan.theme,
                isActive: plan.isActive ?? true,
                maxOrdersPerMonth: plan.maxOrdersPerMonth ?? -1,
                sortOrder: plan.sortOrder ?? 0,
                description: plan.description || '',
                audience: plan.audience || 'tailor',
                pointsPrice: plan.pointsPrice ?? 0,
                durationDays: plan.durationDays ?? 30,
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                price: '',
                billingCycle: 'Monthly',
                commissionRange: '',
                features: '',
                isPopular: false,
                theme: 'basic',
                isActive: true,
                maxOrdersPerMonth: -1,
                sortOrder: 0,
                description: '',
                audience: 'tailor',
                pointsPrice: 0,
                durationDays: 30,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Process features string to array
            const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f);
            
            const payload = {
                ...formData,
                price: Number(formData.price),
                maxOrdersPerMonth: Number(formData.maxOrdersPerMonth),
                sortOrder: Number(formData.sortOrder),
                pointsPrice: Number(formData.pointsPrice) || 0,
                durationDays: Number(formData.durationDays) || 30,
                features: featuresArray
            };

            if (editingPlan) {
                await api.put(`/subscriptions/admin/${editingPlan._id}`, payload);
                toast.success('Plan updated successfully');
            } else {
                await api.post('/subscriptions/admin', payload);
                toast.success('Plan created successfully');
            }

            fetchPlans();
            handleCloseModal();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to save plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        
        try {
            await api.delete(`/subscriptions/admin/${id}`);
            toast.success('Plan deleted successfully');
            fetchPlans();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to delete plan');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await api.patch(`/subscriptions/admin/${id}/toggle`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchPlans();
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to toggle status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription & Memberships</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage tailor subscription tiers, pricing, and active subscriptions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSubscribers}
                        className="p-2 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={isLoadingSubscribers ? 'animate-spin' : ''} />
                    </button>
                    {activeTab === 'plans' && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-sm font-bold"
                        >
                            <Plus size={18} />
                            <span>Create Plan</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex border-b border-gray-200 space-x-8">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
                        activeTab === 'plans'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <CreditCard size={18} />
                    <span>Subscription Plans ({plans.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('subscribers')}
                    className={`py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
                        activeTab === 'subscribers'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Users size={18} />
                    <span>Active Subscribers ({subscribers.length})</span>
                </button>
            </div>

            {/* TAB 1: SUBSCRIPTION PLANS GRID */}
            {activeTab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan._id} className={`bg-white rounded-2xl shadow-sm border relative overflow-hidden flex flex-col ${!plan.isActive ? 'border-gray-200 opacity-75' : plan.theme === 'elite' ? 'border-amber-200' : plan.theme === 'premium' ? 'border-indigo-200' : 'border-gray-200'}`}>
                            
                            {/* Status Ribbon */}
                            {!plan.isActive && (
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-gray-200">
                                        <XCircle size={14} /> Inactive
                                    </span>
                                </div>
                            )}
                            {plan.isActive && plan.isPopular && (
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-200">
                                        <Star size={14} /> Popular
                                    </span>
                                </div>
                            )}

                            <div className={`p-6 border-b ${plan.theme === 'elite' ? 'bg-amber-50/50' : plan.theme === 'premium' ? 'bg-indigo-50/50' : 'bg-gray-50/50'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-xl ${plan.theme === 'elite' ? 'bg-amber-100 text-amber-600' : plan.theme === 'premium' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {plan.theme === 'elite' ? <Star size={20} /> : plan.theme === 'premium' ? <Zap size={20} /> : <CreditCard size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                        <p className="text-xs font-medium text-gray-500 capitalize">{plan.theme} Theme</p>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex items-end gap-1">
                                    {plan.audience === 'customer' ? (
                                        <>
                                            <span className="text-3xl font-black text-gray-900">{plan.pointsPrice || 0}</span>
                                            <span className="text-sm font-medium text-gray-500 mb-1">pts / {plan.durationDays || 30} days</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-3xl font-black text-gray-900">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
                                            <span className="text-sm font-medium text-gray-500 mb-1">/{plan.billingCycle.toLowerCase()}</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">
                                    {plan.audience === 'customer' ? 'Customer · points' : 'Tailor · Razorpay'}
                                </p>
                                {plan.description && (
                                    <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
                                )}
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Commission</p>
                                        <p className="font-semibold text-gray-900 text-sm">{plan.commissionRange}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Order Limit</p>
                                        <p className="font-semibold text-gray-900 text-sm">{plan.maxOrdersPerMonth === -1 ? 'Unlimited' : `${plan.maxOrdersPerMonth}/mo`}</p>
                                    </div>
                                </div>

                                <div className="mb-6 flex-1">
                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Key Features</p>
                                    <ul className="space-y-2">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleToggleStatus(plan._id)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${plan.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                    >
                                        {plan.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(plan)}
                                        className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-primary rounded-xl transition-colors border border-gray-200"
                                        title="Edit Plan"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan._id)}
                                        className="p-2 bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-gray-200"
                                        title="Delete Plan"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 2: ACTIVE SUBSCRIBERS (TAILORS) */}
            {activeTab === 'subscribers' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoadingSubscribers ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                            <p className="text-sm font-bold text-gray-400">Loading subscribed tailors...</p>
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                                <Users size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">No Tailor Subscriptions Purchased Yet</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                When tailors purchase or upgrade to a subscription plan (Starter, Pro, Elite), their active plan, payment history, and expiry date will show up here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100 font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Tailor / Shop</th>
                                        <th className="px-6 py-4">Active Plan</th>
                                        <th className="px-6 py-4">Price & Cycle</th>
                                        <th className="px-6 py-4">Order Limit</th>
                                        <th className="px-6 py-4">Plan Expiry</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {subscribers.map((tailor) => {
                                        const plan = tailor.activePlan || {};
                                        const expiry = tailor.planExpiryDate ? new Date(tailor.planExpiryDate) : null;
                                        const now = new Date();
                                        const isExpired = expiry && expiry < now;
                                        const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

                                        return (
                                            <tr key={tailor._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-[#843D9B] text-white flex items-center justify-center font-black text-sm shrink-0">
                                                            {tailor.user?.name?.charAt(0)?.toUpperCase() || tailor.name?.charAt(0) || 'T'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 leading-none">{tailor.shopName || tailor.name || tailor.user?.name || 'Tailor Partner'}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{tailor.phone || tailor.user?.phoneNumber || tailor.user?.email || ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        <Star size={12} className="text-amber-500 fill-amber-500" />
                                                        <span>{plan.name || 'Active Plan'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-black text-gray-900">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{plan.billingCycle || 'Monthly'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {plan.maxOrdersPerMonth === -1 || !plan.maxOrdersPerMonth ? 'Unlimited' : `${plan.maxOrdersPerMonth} / month`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {expiry ? (
                                                        <div>
                                                            <p className="font-bold text-xs text-gray-900 flex items-center gap-1">
                                                                <Calendar size={12} className="text-gray-400" />
                                                                {expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                            <p className={`text-[10px] font-black mt-0.5 ${isExpired ? 'text-rose-600' : daysLeft <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                {isExpired ? 'Expired' : `${daysLeft} days remaining`}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No Expiry</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isExpired ? (
                                                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                            Expired
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="planForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Plan Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (₹)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            min="0"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Audience</label>
                                        <select
                                            name="audience"
                                            value={formData.audience}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="tailor">Tailor (Razorpay)</option>
                                            <option value="customer">Customer (loyalty points)</option>
                                        </select>
                                    </div>
                                    {formData.audience === 'customer' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Points price</label>
                                                <input
                                                    type="number"
                                                    name="pointsPrice"
                                                    value={formData.pointsPrice}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Duration (days)</label>
                                                <input
                                                    type="number"
                                                    name="durationDays"
                                                    value={formData.durationDays}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Billing Cycle</label>
                                        <select
                                            name="billingCycle"
                                            value={formData.billingCycle}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Commission Range (e.g. 15% - 20%)</label>
                                        <input
                                            type="text"
                                            name="commissionRange"
                                            value={formData.commissionRange}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Theme / Style</label>
                                        <select
                                            name="theme"
                                            value={formData.theme}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            <option value="basic">Basic (Standard styling)</option>
                                            <option value="premium">Premium (Blue/Indigo styling)</option>
                                            <option value="elite">Elite (Gold/Amber styling)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Max Orders Per Month</label>
                                        <input
                                            type="number"
                                            name="maxOrdersPerMonth"
                                            value={formData.maxOrdersPerMonth}
                                            onChange={handleInputChange}
                                            placeholder="-1 for unlimited"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited orders.</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Sort Order</label>
                                        <input
                                            type="number"
                                            name="sortOrder"
                                            value={formData.sortOrder}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-6 mt-6">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                name="isPopular"
                                                checked={formData.isPopular}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Mark as "Popular"</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-green-500 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Active (Visible)</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (Optional)</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="2"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                        placeholder="Short description of the plan..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Features (Comma separated)</label>
                                    <textarea
                                        name="features"
                                        value={formData.features}
                                        onChange={handleInputChange}
                                        rows="4"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                        placeholder="e.g. Standard shop listing, Limited orders, Basic support"
                                        required
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} /> Separate each feature with a comma.
                                    </p>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="planForm"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                            >
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {editingPlan ? 'Save Changes' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubscriptions;
