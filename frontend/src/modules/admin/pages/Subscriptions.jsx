import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, X, Zap, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../tailor/services/api'; // Using existing API service

const AdminSubscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
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
        description: ''
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/subscriptions/admin');
            if (res.data.success) {
                setPlans(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        } finally {
            setIsLoading(false);
        }
    };

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
                description: plan.description || ''
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
                description: ''
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
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage tailor subscription tiers, pricing, and features.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Create Plan</span>
                </button>
            </div>

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
                                <span className="text-3xl font-black text-gray-900">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
                                <span className="text-sm font-medium text-gray-500 mb-1">/{plan.billingCycle.toLowerCase()}</span>
                            </div>
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
