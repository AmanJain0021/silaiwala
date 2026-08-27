import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import useBrandingStore from '../../store/brandingStore';

const getDefaultLegalDoc = (type = '', category = '', appName = 'SewZella') => {
    const isPrivacy = type.toLowerCase().includes('privacy');
    const catName = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Partner';

    if (isPrivacy) {
        return {
            title: `${catName} Privacy Policy`,
            content: `
                <h1>${catName} Privacy Policy</h1>
                <p><strong>Effective Date:</strong> January 1, 2026</p>
                <p>${appName} ("we", "our", or "us") values your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you enroll and serve as a ${catName}.</p>
                
                <h2>1. Information We Collect</h2>
                <p>We collect personal and operational information necessary to facilitate your account setup and order fulfillment:</p>
                <ul>
                    <li><strong>Personal Details:</strong> Name, phone number, email address, national ID, and profile picture.</li>
                    <li><strong>Vehicle & Documentation:</strong> Driver's license details, vehicle registration, and insurance information.</li>
                    <li><strong>Location Data:</strong> Real-time GPS location data when active on duty to enable dispatch and order tracking.</li>
                    <li><strong>Financial Information:</strong> Bank account details or wallet identifiers for payout processing.</li>
                </ul>

                <h2>2. How We Use Your Information</h2>
                <p>Your information is strictly utilized to:</p>
                <ul>
                    <li>Process enrollment and verify partner credentials.</li>
                    <li>Assign delivery requests and provide navigation routing.</li>
                    <li>Calculate and deposit payouts, incentives, and bonuses.</li>
                    <li>Ensure safety, security, and fraud prevention across our platform.</li>
                </ul>

                <h2>3. Data Protection & Sharing</h2>
                <p>We maintain strict security measures to protect your data. We do not sell your personal information. Limited location data is shared with customers only while an assigned order is actively in transit.</p>

                <h2>4. Contact Us</h2>
                <p>If you have questions regarding this Privacy Policy, please contact our support team at <strong>support@silaiwala.com</strong>.</p>
            `
        };
    }

    return {
        title: `${catName} Terms & Conditions`,
        content: `
            <h1>${catName} Terms & Conditions</h1>
            <p><strong>Effective Date:</strong> January 1, 2026</p>
            <p>Welcome to ${appName}. By registering and operating as a ${catName}, you agree to comply with and be bound by the following Terms and Conditions.</p>

            <h2>1. Partner Eligibility & Account Setup</h2>
            <p>To register as a ${catName}, you must be at least 18 years of age, possess a valid government-issued ID, maintain active mobile connectivity, and submit true and accurate registration documents.</p>

            <h2>2. Service Standards & Responsibilities</h2>
            <p>As a ${appName} ${catName}, you agree to:</p>
            <ul>
                <li>Promptly accept and handle assigned orders with professionalism and care.</li>
                <li>Maintain accurate availability status on the app.</li>
                <li>Adhere to safety standards, traffic regulations, and respectful communication with customers and merchant partners.</li>
            </ul>

            <h2>3. Payouts & Compensation</h2>
            <p>Earnings and incentives are calculated per completed order according to ${appName}'s active rate structure. Payouts will be transferred to your registered bank account or wallet per agreed payout schedules.</p>

            <h2>4. Code of Conduct</h2>
            <p>Misconduct, fraudulent activity, unauthorized account sharing, or violation of safety rules will result in immediate account suspension or termination.</p>

            <h2>5. Updates to Terms</h2>
            <p>${appName} reserves the right to modify these Terms & Conditions at any time. Continued use of the platform after updates constitutes acceptance of the revised terms.</p>

            <h2>6. Contact & Support</h2>
            <p>For questions or assistance regarding these terms, reach out to <strong>support@silaiwala.com</strong>.</p>
        `
    };
};

const LegalPage = ({ type: propType, category, fallbackTitle = "Legal Document" }) => {
    const { type: paramType } = useParams();
    const type = propType || paramType || 'terms-and-conditions';
    const navigate = useNavigate();
    const appName = useBrandingStore(state => state.appName);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await api.get(`/cms/content?type=legal&category=${category}`);
                const data = res.data.data || [];
                let match = data.find(item => item.slug === type);
                
                if (!match && data.length > 0) {
                    match = data.find(item => item.title.toLowerCase().includes(type.split('-')[0])) || data[0];
                }

                if (!match) {
                    // Try without category filter
                    const resAll = await api.get(`/cms/content?type=legal`);
                    const allData = resAll.data?.data || [];
                    match = allData.find(item => item.slug === type || item.title?.toLowerCase().includes(type.split('-')[0]));
                }
                
                if (match) {
                    setContent(match);
                } else {
                    setContent(getDefaultLegalDoc(type, category, appName));
                }
                setLoading(false);
            } catch (error) {
                if (error?.name === 'CanceledError' || error?.message?.includes('cancel') || error?.code === 'ERR_CANCELED') {
                    return;
                }
                console.warn("Legal content fetch fallback:", error);
                setContent(getDefaultLegalDoc(type, category, appName));
                setLoading(false);
            }
        };
        fetchContent();
    }, [type, category, appName]);

    return (
        <div className="min-h-screen bg-white font-sans pb-20 overflow-x-hidden w-full">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#843D9B] to-[#843D9B] text-white pt-10 pb-6 px-4 sticky top-0 z-50 shadow-lg">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm cursor-pointer"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">{content ? content.title : fallbackTitle}</h1>
                        <p className="text-xs text-indigo-100 font-medium mt-0.5">Legal & Policies</p>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto px-5 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#843D9B]" />
                        <p className="text-sm font-bold uppercase tracking-widest">Loading Document...</p>
                    </div>
                ) : (
                    <div className="w-full break-words max-w-none text-gray-700 leading-relaxed 
                                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-gray-900
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-gray-900
                                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-gray-900
                                    [&_p]:mb-4 [&_p]:text-[15px] [&_p]:whitespace-normal [&_p]:break-words
                                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:whitespace-normal
                                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1 [&_ol]:whitespace-normal
                                    [&_a]:text-[#843D9B] [&_a]:underline [&_a]:font-medium [&_a]:break-words
                                    [&_strong]:font-bold [&_strong]:text-gray-900
                                    [&_b]:font-bold [&_b]:text-gray-900
                                    [&_*]:max-w-full">
                        <div dangerouslySetInnerHTML={{ __html: content.content }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalPage;
