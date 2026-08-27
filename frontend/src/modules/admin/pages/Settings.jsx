import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, Shield, Bell, CreditCard,
    Smartphone, Globe, Mail, Lock, User, CheckCircle2, Save, Loader2, RefreshCw, DollarSign, Gift, MapPin, Image as ImageIcon, Upload
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import useBrandingStore, { BRANDING_DEFAULTS } from '../../../store/brandingStore';

const AdminSettings = () => {
    const [selectedTab, setSelectedTab] = useState('Branding');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(null);

    // Admin Users State for Security Tab
    const [adminUsers, setAdminUsers] = useState([]);
    const [isFetchingAdmins, setIsFetchingAdmins] = useState(false);
    const [isSavingAdmin, setIsSavingAdmin] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const fetchAdmins = async () => {
        setIsFetchingAdmins(true);
        try {
            const res = await api.get('/admin/users?role=admins');
            setAdminUsers(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch admins:', error);
        } finally {
            setIsFetchingAdmins(false);
        }
    };

    useEffect(() => {
        if (selectedTab === 'Security') {
            fetchAdmins();
        }
    }, [selectedTab]);

    const tabs = [
        { id: 'Branding', icon: <ImageIcon size={16} />, desc: 'App name & logos' },
        { id: 'General', icon: <Globe size={16} />, desc: 'Platform basics' },
        { id: 'Pricing & Fees', icon: <DollarSign size={16} />, desc: 'GST, delivery & advance' },
        { id: 'Loyalty Points', icon: <Gift size={16} />, desc: 'Points rules' },
        { id: 'Security', icon: <Shield size={16} />, desc: 'Roles & permissions' },
        { id: 'Notifications', icon: <Bell size={16} />, desc: 'Email & SMS setup' },
        { id: 'Payment Gateways', icon: <CreditCard size={16} />, desc: 'Razorpay, Stripe' },
        { id: 'App Config', icon: <Smartphone size={16} />, desc: 'Mobile app settings' },
        { id: 'Tailor Discovery', icon: <MapPin size={16} />, desc: 'Search settings' },
    ];

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/settings');
            setSettings(res.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message === 'canceled' || error?.message?.includes('Cancelled')) {
                console.log('Request canceled, ignoring...');
                return;
            }
            console.error('Failed to fetch settings:', error);
            import('react-hot-toast').then(module => module.toast.error('Failed to load system settings'));
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
            const platformName = settings.general?.platformName || BRANDING_DEFAULTS.appName;
            useBrandingStore.setState({
                appName: platformName,
                logos: {
                    customer: settings.general?.appLogos?.customer || BRANDING_DEFAULTS.logos.customer,
                    tailor: settings.general?.appLogos?.tailor || BRANDING_DEFAULTS.logos.tailor,
                    delivery: settings.general?.appLogos?.delivery || BRANDING_DEFAULTS.logos.delivery,
                    measurementExecutive: settings.general?.appLogos?.measurementExecutive || BRANDING_DEFAULTS.logos.measurementExecutive,
                },
                isLoaded: true,
            });
            document.title = platformName;
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

    const logoOptions = [
        { key: 'customer', label: 'Customer App', fallback: BRANDING_DEFAULTS.logos.customer },
        { key: 'tailor', label: 'Tailor App', fallback: BRANDING_DEFAULTS.logos.tailor },
        { key: 'delivery', label: 'Delivery Partner App', fallback: BRANDING_DEFAULTS.logos.delivery },
        { key: 'measurementExecutive', label: 'Measurement Executive App', fallback: BRANDING_DEFAULTS.logos.measurementExecutive },
    ];

    const handleLogoUpload = async (key, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploadingLogo(key);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const uploadedUrl = res.data.data;
            updateNestedSetting('general', 'appLogos', {
                ...(settings.general?.appLogos || {}),
                [key]: uploadedUrl,
            });
            toast.success('Logo uploaded. Save changes to publish it.');
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Logo upload failed:', error);
            toast.error(error.response?.data?.message || 'Logo upload failed');
        } finally {
            setUploadingLogo(null);
        }
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

                    {selectedTab === 'Branding' && settings && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Branding</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Control the public app name and role-specific logos.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">App Name</label>
                                <input 
                                    type="text" 
                                    value={settings.general?.platformName || ''} 
                                    onChange={(e) => updateNestedSetting('general', 'platformName', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                />
                                <p className="text-[10px] text-gray-400 font-medium mt-2">
                                    This name and these logos appear across the Customer, Tailor, Delivery Partner, and Measurement Executive apps immediately after saving.
                                </p>
                            </div>

                            <hr className="border-gray-50" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {logoOptions.map((logo) => {
                                    const value = settings.general?.appLogos?.[logo.key] || logo.fallback;
                                    const inputId = `branding-logo-${logo.key}`;

                                    return (
                                        <div key={logo.key} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <label className="block text-xs font-black text-gray-900">{logo.label}</label>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">PNG, JPG, or WebP</p>
                                                </div>
                                                <div className="h-14 w-14 rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                                    <img src={value} alt={`${logo.label} logo`} className="w-full h-full object-contain" />
                                                </div>
                                            </div>

                                            <label
                                                htmlFor={inputId}
                                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-[10px] font-black rounded-xl hover:border-primary hover:text-primary transition-all uppercase tracking-widest cursor-pointer ${uploadingLogo === logo.key ? 'opacity-60 pointer-events-none' : ''}`}
                                            >
                                                {uploadingLogo === logo.key ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                {uploadingLogo === logo.key ? 'Uploading...' : 'Upload Logo'}
                                                <input 
                                                    id={inputId}
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        handleLogoUpload(logo.key, e.target.files?.[0]);
                                                        e.target.value = '';
                                                    }}
                                                    className="hidden" 
                                                    disabled={uploadingLogo === logo.key}
                                                />
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            updateNestedSetting('general', 'supportPhone', val);
                                        }}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        maxLength={10}
                                        placeholder="1234567890"
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
                                <p className="text-xs text-gray-500 font-medium mt-1">GST, platform fee, delivery rates, and free-delivery rules (used on customer checkout).</p>
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
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">Applied to order subtotal + platform fee (before delivery).</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Free delivery from (₹)</label>
                                    <input 
                                        type="number" 
                                        min={0}
                                        value={settings.pricing?.freeDeliveryMinOrder ?? 999} 
                                        onChange={(e) => updateNestedSetting('pricing', 'freeDeliveryMinOrder', Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                                        Customer gets FREE delivery when order merchandise is ₹{settings.pricing?.freeDeliveryMinOrder ?? 999} or more. Delivery partners are still paid from the platform. Set 0 to always charge delivery.
                                    </p>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Wallet Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Advance Payment (%)</label>
                                        <input 
                                            type="number" 
                                            value={settings.walletConfig?.advancePercentage ?? 30} 
                                            onChange={(e) => updateNestedSetting('walletConfig', 'advancePercentage', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Minimum advance payment for orders.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Platform Fee (%)</label>
                                        <input 
                                            type="number" 
                                            value={settings.walletConfig?.platformFeePercentage ?? 5} 
                                            onChange={(e) => updateNestedSetting('walletConfig', 'platformFeePercentage', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Platform fee deducted from vendor earnings.</p>
                                    </div>
                                </div>
                                <div className={`mt-6 flex items-center justify-between p-6 rounded-2xl border transition-all ${settings.walletConfig?.withdrawalApprovalRequired ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-wider ${settings.walletConfig?.withdrawalApprovalRequired ? 'text-primary' : 'text-gray-900'}`}>Withdrawal Approvals</p>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Require admin approval for partner withdrawal requests.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-110">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={settings.walletConfig?.withdrawalApprovalRequired ?? true}
                                            onChange={(e) => updateNestedSetting('walletConfig', 'withdrawalApprovalRequired', e.target.checked)}
                                        />
                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">COD Wallet Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Cash Limit (₹)</label>
                                        <input 
                                            type="number" 
                                            value={settings.codWalletConfig?.maxCashLimit ?? 5000} 
                                            onChange={(e) => updateNestedSetting('codWalletConfig', 'maxCashLimit', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Maximum COD cash a rider can hold.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Deposit Time (Hours)</label>
                                        <input 
                                            type="number" 
                                            value={settings.codWalletConfig?.maxDepositTimeHours ?? 24} 
                                            onChange={(e) => updateNestedSetting('codWalletConfig', 'maxDepositTimeHours', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Time allowed to deposit cash before block.</p>
                                    </div>
                                </div>
                                <div className={`mt-6 flex items-center justify-between p-6 rounded-2xl border transition-all ${settings.codWalletConfig?.autoBlockOnLimit ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-gray-50 border-gray-100'}`}>
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-wider ${settings.codWalletConfig?.autoBlockOnLimit ? 'text-primary' : 'text-gray-900'}`}>Auto-Block on Limit Exceeded</p>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Automatically prevent new task assignments if cash limit is exceeded.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-110">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={settings.codWalletConfig?.autoBlockOnLimit ?? true}
                                            onChange={(e) => updateNestedSetting('codWalletConfig', 'autoBlockOnLimit', e.target.checked)}
                                        />
                                        <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-gray-50" />

                            <div>
                                <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Tailor at Home / Measurement Visit Fees</h3>
                                <p className="text-[11px] text-gray-500 font-medium mb-4">
                                    Customer pays this visit fee on checkout, and the Measurement Executive earns the same locked amount when the visit is completed.
                                </p>
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
                                <p className="text-[10px] text-gray-400 font-medium mt-3">
                                    Formula: base fee if within free km; otherwise base + (distance − free km) × per-km fee.
                                </p>
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

                    {selectedTab === 'Loyalty Points' && settings && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Loyalty Points Configuration</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Manage rules for awarding and deducting loyalty points.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points per ₹100 Spent</label>
                                    <input 
                                        type="number" 
                                        value={settings.loyaltyConfig?.pointsPer100Spent ?? 5} 
                                        onChange={(e) => updateNestedSetting('loyaltyConfig', 'pointsPer100Spent', Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium mt-1">Awarded on order completion.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Flat Points per Booking</label>
                                    <input 
                                        type="number" 
                                        value={settings.loyaltyConfig?.flatPointsPerBooking ?? 0} 
                                        onChange={(e) => updateNestedSetting('loyaltyConfig', 'flatPointsPerBooking', Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">1 Point Value (₹)</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={settings.loyaltyConfig?.redemptionValuePerPoint ?? settings.loyaltyConfig?.redemptionValueInINR ?? 1} 
                                        onChange={(e) => updateNestedSetting('loyaltyConfig', 'redemptionValuePerPoint', Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Cancellation Penalty (Points)</label>
                                    <input 
                                        type="number" 
                                        value={settings.loyaltyConfig?.cancellationPenalty ?? 50} 
                                        onChange={(e) => updateNestedSetting('loyaltyConfig', 'cancellationPenalty', Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-red-500 transition-colors shadow-sm" 
                                    />
                                    <p className="text-[10px] text-red-400 font-medium mt-1">Deducted when order is cancelled.</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">Referral rewards</h3>
                                <p className="text-xs text-gray-500 font-medium mb-4">
                                    Decide how many loyalty points the referrer and the new friend get when they sign up with a referral code. 1 point = ₹1.
                                </p>
                                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.referralConfig?.enabled !== false}
                                        onChange={(e) => updateNestedSetting('referralConfig', 'enabled', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-gray-800">Enable referral point rewards</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Referrer points (who shared the code)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={settings.referralConfig?.referrerPointsOnFirstAdvance ?? 50}
                                            onChange={(e) => updateNestedSetting('referralConfig', 'referrerPointsOnFirstAdvance', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Credited instantly when a friend signs up with their code.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">New friend points (who used the code)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={settings.referralConfig?.refereePointsOnFirstAdvance ?? 25}
                                            onChange={(e) => updateNestedSetting('referralConfig', 'refereePointsOnFirstAdvance', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-1">Welcome bonus on signup with a valid referral code.</p>
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

                    {selectedTab === 'Tailor Discovery' && settings && (
                        <div className="p-8 space-y-8 max-w-3xl">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Tailor Discovery Settings</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Configure how users find tailors on the platform.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={settings.tailorSearch?.searchRadiusKm === 'default' || settings.tailorSearch?.searchRadiusKm === 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        updateNestedSetting('tailorSearch', 'searchRadiusKm', 'default');
                                                    } else {
                                                        updateNestedSetting('tailorSearch', 'searchRadiusKm', 10);
                                                    }
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                        <div>
                                            <span className="text-xs font-bold text-gray-700 block">Show All Tailors (Default)</span>
                                            <span className="text-[10px] text-gray-400">Toggle to disable radius limit and show all tailors.</span>
                                        </div>
                                    </div>

                                    {(settings.tailorSearch?.searchRadiusKm !== 'default' && settings.tailorSearch?.searchRadiusKm !== 0) && (
                                        <div className="mt-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Tailor Search Radius (km)</label>
                                            <input 
                                                type="number" 
                                                value={settings.tailorSearch?.searchRadiusKm === '' ? '' : (settings.tailorSearch?.searchRadiusKm ?? 10)} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateNestedSetting('tailorSearch', 'searchRadiusKm', val === '' ? '' : Number(val));
                                                }}
                                                className="w-full md:w-1/2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                                min="1"
                                            />
                                            <p className="text-[10px] text-gray-500 font-medium mt-2">
                                                Only tailors within this radius from the user will be shown.
                                            </p>
                                        </div>
                                    )}
                                </div>
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
                                {isFetchingAdmins ? (
                                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                                ) : adminUsers.map((admin) => (
                                    <div key={admin._id} className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-gray-200 transition-all hover:shadow-sm bg-white">
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
                                            <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border ${admin.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                {admin.role ? admin.role.replace('_', ' ') : 'Admin'}
                                            </span>
                                            <button 
                                                onClick={() => {
                                                    setSelectedAdmin(admin);
                                                    setIsManageModalOpen(true);
                                                }}
                                                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                            >
                                                Manage
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button className="w-full py-4 border-2 border-dashed border-gray-100 text-gray-400 font-black text-[10px] rounded-2xl hover:bg-gray-50 hover:border-gray-200 hover:text-gray-600 transition-all uppercase tracking-[0.2em] mt-4">
                                    + Add New Admin User
                                </button>
                            </div>
                        </div>
                    )}

                    {(selectedTab !== 'Branding' && selectedTab !== 'General' && selectedTab !== 'Security' && selectedTab !== 'Payment Gateways' && selectedTab !== 'Tailor Discovery') && (
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

            {/* Manage Admin Modal */}
            <AnimatePresence>
                {isManageModalOpen && selectedAdmin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsManageModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">Manage Admin User</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Update roles and permissions</p>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Name</label>
                                    <input type="text" value={selectedAdmin.name} readOnly className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Email</label>
                                    <input type="text" value={selectedAdmin.email} readOnly className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 outline-none cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Role</label>
                                    <select 
                                        value={selectedAdmin.role} 
                                        onChange={(e) => setSelectedAdmin({...selectedAdmin, role: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        <option value="super_admin">Super Admin</option>
                                        <option value="admin">Admin</option>
                                        <option value="support_agent">Support Agent</option>
                                        <option value="finance_manager">Finance Manager</option>
                                        <option value="content_manager">Content Manager</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Status</label>
                                    <select 
                                        value={selectedAdmin.isActive ? 'true' : 'false'} 
                                        onChange={(e) => setSelectedAdmin({...selectedAdmin, isActive: e.target.value === 'true'})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-3xl">
                                <button onClick={() => setIsManageModalOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                    Cancel
                                </button>
                                <button 
                                    disabled={isSavingAdmin}
                                    onClick={async () => {
                                        setIsSavingAdmin(true);
                                        try {
                                            await api.put(`/admin/users/${selectedAdmin._id}/status`, {
                                                isActive: selectedAdmin.isActive,
                                                role: selectedAdmin.role
                                            });
                                            toast.success('Admin updated successfully');
                                            setIsManageModalOpen(false);
                                            fetchAdmins();
                                        } catch (error) {
                                            toast.error('Failed to update admin');
                                        } finally {
                                            setIsSavingAdmin(false);
                                        }
                                    }} 
                                    className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    {isSavingAdmin ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSettings;
