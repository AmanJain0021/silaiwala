import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, Shield, Bell, CreditCard,
    Smartphone, Globe, Mail, Lock, User, CheckCircle2, Save, Loader2, RefreshCw, DollarSign
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
    const [selectedTab, setSelectedTab] = useState('General');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState(null);

    const tabs = [
        { id: 'General', icon: <Globe size={16} />, desc: 'Platform basics' },
        { id: 'Pricing & Fees', icon: <DollarSign size={16} />, desc: 'GST & Visit charges' },
        { id: 'Security', icon: <Shield size={16} />, desc: 'Roles & permissions' },
        { id: 'Notifications', icon: <Bell size={16} />, desc: 'Email & SMS setup' },
        { id: 'Payment Gateways', icon: <CreditCard size={16} />, desc: 'Razorpay, Stripe' },
        { id: 'App Config', icon: <Smartphone size={16} />, desc: 'Mobile app settings' },
    ];

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load system settings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put('/admin/settings', settings);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const updateNestedSetting = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Syncing System Config...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Configure global parameters, integrations, and access controls</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark disabled:opacity-50 shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 h-full overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-max">
                    <div className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${selectedTab === tab.id
                                        ? 'bg-primary/10 text-primary font-black'
                                        : 'text-gray-600 font-bold hover:bg-gray-50'
                                    }`}
                            >
                                <span className={selectedTab === tab.id ? 'text-primary' : 'text-gray-400'}>
                                    {tab.icon}
                                </span>
                                <div>
                                    <p className="text-xs">{tab.id}</p>
                                    <p className={`text-[9px] font-medium mt-0.5 ${selectedTab === tab.id ? 'text-primary/70' : 'text-gray-400'}`}>
                                        {tab.desc}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto custom-scrollbar">

                    {selectedTab === 'General' && settings && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">General Information</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Basic details about the platform that are public-facing.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Platform Name</label>
                                    <input 
                                        type="text" 
                                        value={settings.general.platformName} 
                                        onChange={(e) => updateNestedSetting('general', 'platformName', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Support Email</label>
                                    <input 
                                        type="email" 
                                        value={settings.general.supportEmail} 
                                        onChange={(e) => updateNestedSetting('general', 'supportEmail', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Support Phone</label>
                                    <input 
                                        type="tel" 
                                        value={settings.general.supportPhone} 
                                        onChange={(e) => updateNestedSetting('general', 'supportPhone', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Emergency SOS Phone</label>
                                    <input 
                                        type="tel" 
                                        value={settings.general.emergencyPhone || ''} 
                                        onChange={(e) => updateNestedSetting('general', 'emergencyPhone', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-500 transition-colors shadow-sm" 
                                        placeholder="+91 100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Currency Default</label>
                                    <select 
                                        value={settings.general.currencyDefault}
                                        onChange={(e) => updateNestedSetting('general', 'currencyDefault', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors appearance-none shadow-sm"
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Maintenance Mode</h3>
                                <div className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${settings.maintenanceMode.enabled ? 'bg-orange-50 border-orange-200 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-wider ${settings.maintenanceMode.enabled ? 'text-orange-900' : 'text-gray-900'}`}>{settings.maintenanceMode.enabled ? 'Maintenance Mode Active' : 'Enable Maintenance Mode'}</p>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">When enabled, the application will be temporarily hidden from users with a custom message.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-110">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={settings.maintenanceMode.enabled}
                                            onChange={(e) => updateNestedSetting('maintenanceMode', 'enabled', e.target.checked)}
                                        />
                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'Pricing & Fees' && settings && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Pricing & Fees Configurations</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Manage global GST settings and Tailor at Home visit fees.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">GST Percentage (%)</label>
                                    <input 
                                        type="number" 
                                        value={settings.pricing?.gstPercentage ?? 5} 
                                        onChange={(e) => updateNestedSetting('pricing', 'gstPercentage', Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">Applied universally to all order subtotals.</p>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Tailor at Home Fees</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Base Visit Fee (₹)</label>
                                        <input 
                                            type="number" 
                                            value={settings.visitFee?.baseFee ?? 150} 
                                            onChange={(e) => updateNestedSetting('visitFee', 'baseFee', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Free Radius (km)</label>
                                        <input 
                                            type="number" 
                                            value={settings.visitFee?.freeKm ?? 3} 
                                            onChange={(e) => updateNestedSetting('visitFee', 'freeKm', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Fee Per Extra km (₹)</label>
                                        <input 
                                            type="number" 
                                            value={settings.visitFee?.perKmFee ?? 20} 
                                            onChange={(e) => updateNestedSetting('visitFee', 'perKmFee', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Delivery Partner Payouts</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Base Delivery Fee (₹)</label>
                                        <input 
                                            type="number" 
                                            value={settings.deliveryRates?.baseFee ?? 20} 
                                            onChange={(e) => updateNestedSetting('deliveryRates', 'baseFee', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Delivery Fee Per km (₹)</label>
                                        <input 
                                            type="number" 
                                            value={settings.deliveryRates?.perKmRate ?? 10} 
                                            onChange={(e) => updateNestedSetting('deliveryRates', 'perKmRate', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'Payment Gateways' && settings && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Payment Gateway Integrations</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Configure your transaction processors and API keys.</p>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center font-bold text-primary shadow-sm">RP</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">Razorpay</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Standard Indian payment gateway</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={settings.paymentGateways.razorpay.enabled}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                paymentGateways: {
                                                    ...prev.paymentGateways,
                                                    razorpay: { ...prev.paymentGateways.razorpay, enabled: e.target.checked }
                                                }
                                            }))}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                {settings.paymentGateways.razorpay.enabled && (
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Key ID</label>
                                            <input 
                                                type="text" 
                                                value={settings.paymentGateways.razorpay.keyId || ''} 
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    paymentGateways: {
                                                        ...prev.paymentGateways,
                                                        razorpay: { ...prev.paymentGateways.razorpay, keyId: e.target.value }
                                                    }
                                                }))}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Key Secret</label>
                                            <input 
                                                type="password" 
                                                value={settings.paymentGateways.razorpay.keySecret || ''} 
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    paymentGateways: {
                                                        ...prev.paymentGateways,
                                                        razorpay: { ...prev.paymentGateways.razorpay, keySecret: e.target.value }
                                                    }
                                                }))}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500" 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'Security' && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Admin Roles & Permissions</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Manage who has access to the admin panel and what they can do.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { name: 'Ritesh Kumar', email: 'ritesh@silaiwala.com', role: 'Super Admin', status: 'Active' },
                                    { name: 'Aman Singh', email: 'aman@silaiwala.com', role: 'Support Agent', status: 'Active' },
                                    { name: 'Neha Gupta', email: 'neha@silaiwala.com', role: 'Finance Manager', status: 'Inactive' },
                                ].map((admin, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-gray-200 transition-all hover:shadow-sm bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-primary border border-gray-100">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{admin.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold">{admin.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border ${admin.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                {admin.role}
                                            </span>
                                            <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Manage</button>
                                        </div>
                                    </div>
                                ))}

                                <button className="w-full py-4 border-2 border-dashed border-gray-100 text-gray-400 font-black text-[10px] rounded-2xl hover:bg-gray-50 hover:border-gray-200 hover:text-gray-600 transition-all uppercase tracking-[0.2em] mt-4">
                                    + Add New Admin User
                                </button>
                            </div>
                        </div>
                    )}

                    {(selectedTab !== 'General' && selectedTab !== 'Security' && selectedTab !== 'Payment Gateways') && (
                        <div className="p-16 text-center flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="p-6 bg-gray-50 rounded-full mb-6">
                                <SettingsIcon size={48} className="opacity-30 animate-spin-slow" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">{selectedTab} Configuration</h3>
                            <p className="text-xs mt-3 max-w-sm font-medium leading-relaxed">Integration for {selectedTab} is initialized. Detailed settings will appear here shortly.</p>
                            <button onClick={fetchSettings} className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest hover:underline">
                                <RefreshCw size={12} /> Sync Latest
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
