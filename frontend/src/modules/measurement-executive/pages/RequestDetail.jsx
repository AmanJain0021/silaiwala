import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { 
    CheckCircle, 
    Plus, 
    Check, 
    AlertCircle, 
    Sparkles, 
    Navigation, 
    RotateCw,
    X,
    ClipboardList
} from 'lucide-react';

// Reusable components for pixel-perfect recreation
import Header from '../components/measurement-sheet/Header';
import CustomerCard from '../components/measurement-sheet/CustomerCard';
import ProgressStepper from '../components/measurement-sheet/ProgressStepper';
import ItemTabs from '../components/measurement-sheet/ItemTabs';
import MeasurementRow from '../components/measurement-sheet/MeasurementRow';
import MeasurementGuide from '../components/measurement-sheet/MeasurementGuide';
import ReferenceImages from '../components/measurement-sheet/ReferenceImages';
import BottomActions from '../components/measurement-sheet/BottomActions';
import CustomMeasurementModal from '../components/measurement-sheet/CustomMeasurementModal';
import AddItemModal from '../components/measurement-sheet/AddItemModal';
import CustomerDetailsModal from '../components/measurement-sheet/CustomerDetailsModal';
import OTPModal from '../components/measurement-sheet/OTPModal';

// Standard 10 Kameez measurements matching the screenshot
const STANDARD_KAMEEZ_FIELDS = [
    { key: 'shoulder', label: 'Shoulder', defaultValue: '14.5', guideNumber: 1, instruction: 'Measure straight across the back from shoulder tip to shoulder tip.' },
    { key: 'chest', label: 'Chest', defaultValue: '36.0', guideNumber: 2, instruction: 'Measure around the fullest part of the chest keeping tape horizontal.' },
    { key: 'bust', label: 'Bust', defaultValue: '38.0', guideNumber: null, instruction: 'Measure around the fullest part of the bustline with arms down.' },
    { key: 'waist', label: 'Waist', defaultValue: '32.0', guideNumber: 4, instruction: 'Measure around the narrowest part of the natural waist.' },
    { key: 'hip', label: 'Hip', defaultValue: '40.0', guideNumber: 5, instruction: 'Measure around the widest part of the hips and buttocks.' },
    { key: 'armhole', label: 'Armhole', defaultValue: '17.0', guideNumber: null, instruction: 'Measure around the shoulder joint and armpit comfortably.' },
    { key: 'sleeveLength', label: 'Sleeve Length', defaultValue: '22.0', guideNumber: 6, instruction: 'Measure from shoulder bone along slightly bent arm to wrist.' },
    { key: 'kameezLength', label: 'Kameez Length', defaultValue: '46.0', guideNumber: 7, instruction: 'Measure from shoulder neck intersection down to desired hemline.' },
    { key: 'neckWidth', label: 'Neck Width', defaultValue: '3.0', guideNumber: 9, instruction: 'Measure horizontally across the base of the neck.' },
    { key: 'neckDepth', label: 'Neck Depth', defaultValue: '7.0', guideNumber: 10, instruction: 'Measure vertically from shoulder seam down to front neck point.' },
];

const STANDARD_BOTTOM_FIELDS = [
    { key: 'waist', label: 'Waist', defaultValue: '32.0', instruction: 'Measure around natural waistline where trousers sit.' },
    { key: 'hip', label: 'Hips', defaultValue: '40.0', instruction: 'Measure around fullest circumference of hips.' },
    { key: 'length', label: 'Full Length', defaultValue: '39.0', instruction: 'Measure from waistline down to ankle or floor.' },
    { key: 'inseam', label: 'Inseam', defaultValue: '28.0', instruction: 'Measure from crotch seam down to inner ankle hem.' },
    { key: 'thigh', label: 'Thigh Width', defaultValue: '22.0', instruction: 'Measure around the fullest part of the upper thigh.' },
    { key: 'bottom', label: 'Bottom Opening', defaultValue: '14.0', instruction: 'Measure circumference of bottom pant cuff opening.' },
];

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        getRequestDetail, 
        acceptRequest, 
        rejectRequest, 
        generateOTP, 
        verifyOTP, 
        uploadMeasurements, 
        completeMeasurement 
    } = useMeasurementStore();

    // Core data state
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resendingOtp, setResendingOtp] = useState(false);

    // Active flow step: 'arrived' | 'measuring' | 'confirm' | 'complete'
    const [currentStep, setCurrentStep] = useState('measuring');

    // Modals
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isCustomMeasurementModalOpen, setIsCustomMeasurementModalOpen] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

    // Garment items & active tab
    const [items, setItems] = useState([
        { id: 'suit_1', name: 'Suit 1', type: 'top' },
        { id: 'suit_2', name: 'Suit 2', type: 'top' },
        { id: 'bottom', name: 'Bottom', type: 'bottom' },
    ]);
    const [activeTabId, setActiveTabId] = useState('suit_1');

    // Per-item measurements: { [itemId]: { [key]: value } }
    const [measurementsByItem, setMeasurementsByItem] = useState({});
    
    // Per-item custom fields: { [itemId]: [ { key, label, unit } ] }
    const [customFieldsByItem, setCustomFieldsByItem] = useState({});

    // Highlighted measurement from guide click
    const [highlightedFieldKey, setHighlightedFieldKey] = useState(null);
    const [activeGuideNumber, setActiveGuideNumber] = useState(null);

    // Notes
    const [notes, setNotes] = useState('');

    // Reference images (URLs or File objects)
    const [referenceImages, setReferenceImages] = useState([
        '/assets/images/fabric_ref.jpg',
        '/assets/images/kameez_ref.jpg'
    ]);

    // Socket reference for live sync
    const socketRef = useRef(null);

    // ── Load request detail ──
    const loadDetail = async () => {
        try {
            const data = await getRequestDetail(id);
            setRequest(data);

            // Determine stepper status based on request status
            if (data.status === 'completed') {
                setCurrentStep('complete');
            } else if (data.status === 'otp_verified') {
                setCurrentStep('complete');
            } else if (data.status === 'otp_sent' || data.status === 'measurements_uploaded') {
                setCurrentStep('confirm');
            } else {
                setCurrentStep('measuring');
            }

            // Populate items strictly from order
            if (data.order?.items?.length > 0) {
                const orderItems = data.order.items.map((it, idx) => {
                    const title = it.service?.title || it.service?.name || it.product?.name || `Item ${idx + 1}`;
                    const categoryName = (it.service?.category?.name || title).toLowerCase();
                    const isBot = /pajama|pant|trouser|salwar|bottom|plazo|palazzo|skirt/i.test(title) || 
                                  /pajama|pant|trouser|salwar|bottom|plazo|palazzo|skirt/i.test(categoryName);
                    
                    // Parse category measurement fields if available
                    let customCategoryFields = null;
                    if (Array.isArray(it.service?.category?.measurementFields) && it.service.category.measurementFields.length > 0) {
                        customCategoryFields = it.service.category.measurementFields
                            .filter(f => f && (f.key || f.label))
                            .map(f => ({
                                key: f.key || f.label.toLowerCase().replace(/\s+/g, '_'),
                                label: f.label || f.key,
                                defaultValue: f.defaultValue || f.placeholder || '0.0',
                                instruction: f.instruction || f.placeholder || ''
                            }));
                    }

                    return {
                        id: `order_item_${idx}`,
                        name: title,
                        type: isBot ? 'bottom' : 'top',
                        categoryName: it.service?.category?.name || (isBot ? 'Pajama' : 'Kameez'),
                        categoryFields: customCategoryFields,
                        rawItem: it
                    };
                });
                
                setItems(orderItems);
                setActiveTabId(orderItems[0].id);
            }

            // Extract all real order images
            const orderImages = [];
            if (data.order?.items) {
                data.order.items.forEach((it) => {
                    const primaryImg = it.service?.image || 
                                       it.product?.image || 
                                       it.product?.images?.[0] || 
                                       it.selectedFabric?.image || 
                                       it.selectedFabric?.images?.[0] || 
                                       it.image;
                    if (primaryImg && !orderImages.includes(primaryImg)) {
                        orderImages.push(primaryImg);
                    }
                    if (Array.isArray(it.service?.images)) {
                        it.service.images.forEach((img) => {
                            if (img && !orderImages.includes(img)) orderImages.push(img);
                        });
                    }
                    if (Array.isArray(it.customDesignRef?.referenceImages)) {
                        it.customDesignRef.referenceImages.forEach((img) => {
                            if (img && !orderImages.includes(img)) orderImages.push(img);
                        });
                    }
                });
            }
            if (Array.isArray(data.order?.exchangeDetails?.images)) {
                data.order.exchangeDetails.images.forEach((img) => {
                    if (img && !orderImages.includes(img)) orderImages.push(img);
                });
            }
            if (Array.isArray(data.report?.photos) && data.report.photos.length > 0) {
                data.report.photos.forEach((img) => {
                    if (img && !orderImages.includes(img)) orderImages.push(img);
                });
            }

            if (orderImages.length > 0) {
                setReferenceImages(orderImages);
            } else {
                setReferenceImages([
                    '/assets/images/fabric_ref.jpg',
                    '/assets/images/kameez_ref.jpg'
                ]);
            }

            // Restore from report notes if existing
            if (data.report?.notes) {
                setNotes(data.report.notes);
            }

            // Restore from localStorage draft if present
            const draftKey = `sewzella_draft_${id}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed.measurementsByItem) setMeasurementsByItem(parsed.measurementsByItem);
                    if (parsed.customFieldsByItem) setCustomFieldsByItem(parsed.customFieldsByItem);
                    if (parsed.notes) setNotes(parsed.notes);
                } catch (e) {
                    console.error('Failed to parse draft', e);
                }
            }
        } catch (error) {
            if (error.name === 'CanceledError') return;
            console.error('Failed to load request detail:', error);
            toast.error(`Failed to load request: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
    }, [id]);

    // Initialize default measurements for active items if empty
    useEffect(() => {
        setMeasurementsByItem((prev) => {
            const next = { ...prev };
            items.forEach((item) => {
                if (!next[item.id]) {
                    const initial = {};
                    const fields = item.type === 'bottom' ? STANDARD_BOTTOM_FIELDS : STANDARD_KAMEEZ_FIELDS;
                    fields.forEach((f) => {
                        initial[f.key] = f.defaultValue;
                    });
                    next[item.id] = initial;
                }
            });
            return next;
        });
    }, [items]);

    // Socket connection
    useEffect(() => {
        const token = localStorage.getItem('executive_token') || localStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        const orderId = request?.order?._id || request?.order;
        if (orderId) {
            socket.emit('join_order_room', orderId);
        }

        socket.on('measurement_otp_verified', () => {
            toast.success('Customer OTP Verified!');
            setCurrentStep('complete');
            setIsOtpModalOpen(false);
            loadDetail();
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [request?.order]);

    // Handle accepting request
    const handleAccept = async () => {
        setAccepting(true);
        try {
            await acceptRequest(id);
            toast.success('Request Accepted! You can now take measurements.');
            await loadDetail();
            setCurrentStep('measuring');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept request');
        } finally {
            setAccepting(false);
        }
    };

    // Update single measurement value
    const handleMeasurementChange = (key, value) => {
        setMeasurementsByItem((prev) => ({
            ...prev,
            [activeTabId]: {
                ...(prev[activeTabId] || {}),
                [key]: value
            }
        }));
    };

    // Add custom measurement row
    const handleAddCustomMeasurement = (newField) => {
        setCustomFieldsByItem((prev) => ({
            ...prev,
            [activeTabId]: [...(prev[activeTabId] || []), newField]
        }));
        handleMeasurementChange(newField.key, newField.value);
        toast.success(`Added ${newField.label}`);
    };

    // Add new garment tab
    const handleAddItem = (newItem) => {
        setItems((prev) => [...prev, newItem]);
        setActiveTabId(newItem.id);
        toast.success(`Added ${newItem.name}`);
    };

    // Add reference photos
    const handleAddPhotos = (newFiles) => {
        setReferenceImages((prev) => [...prev, ...newFiles]);
        toast.success(`Added ${newFiles.length} photo(s)`);
    };

    // Remove reference photo
    const handleRemovePhoto = (idxToRemove) => {
        setReferenceImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    };

    // Highlight from guide hotspot
    const handleSelectGuideNumber = (num) => {
        setActiveGuideNumber(num);
        if (!num) {
            setHighlightedFieldKey(null);
            return;
        }
        const matched = STANDARD_KAMEEZ_FIELDS.find((f) => f.guideNumber === num);
        if (matched) {
            setHighlightedFieldKey(matched.key);
            const el = document.getElementById(`m-row-${num}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    // Save draft locally
    const handleSaveDraft = () => {
        try {
            const draftData = {
                measurementsByItem,
                customFieldsByItem,
                notes,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(`sewzella_draft_${id}`, JSON.stringify(draftData));
            toast.success('Draft saved successfully!', {
                icon: '💾',
                style: {
                    borderRadius: '16px',
                    background: '#2B0E4C',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '13px'
                }
            });
        } catch (e) {
            toast.error('Failed to save draft');
        }
    };

    // Save & Continue (upload measurements & generate OTP)
    const handleSaveAndContinue = async () => {
        setUploading(true);
        try {
            // Upload newly selected photos if any are File objects
            const newFiles = referenceImages.filter((img) => img instanceof File);
            const existingUrls = referenceImages.filter((img) => typeof img === 'string');
            let uploadedUrls = [];

            if (newFiles.length > 0) {
                const photoData = new FormData();
                newFiles.forEach((p) => photoData.append('images', p));
                photoData.append('folder', 'measurements/photos');
                const photoRes = await api.post('/upload/bulk', photoData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (photoRes.data.success) {
                    uploadedUrls = photoRes.data.data;
                }
            }

            const allPhotoUrls = [...existingUrls, ...uploadedUrls];

            // Build payload
            const primaryValues = measurementsByItem[items[0]?.id] || {};
            const itemsPayload = items.map((item, idx) => ({
                index: idx,
                title: item.name,
                categoryName: item.type,
                values: measurementsByItem[item.id] || {}
            }));

            const formData = {
                ...primaryValues,
                __multi: items.length > 1,
                items: itemsPayload
            };

            // Call API to upload measurements
            await uploadMeasurements(id, {
                formData,
                notes,
                photos: allPhotoUrls,
                unit: 'inches'
            });

            // Generate OTP for customer confirmation
            try {
                await generateOTP(id);
                toast.success('Measurements recorded! OTP sent to customer.');
            } catch (otpErr) {
                console.warn('OTP generation notice:', otpErr);
                toast.success('Measurements saved!');
            }

            // Transition stepper to Confirm stage & open modal
            setCurrentStep('confirm');
            setIsOtpModalOpen(true);
            await loadDetail();
        } catch (error) {
            console.error('Save & Continue error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit measurements');
        } finally {
            setUploading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (enteredOtp) => {
        setVerifying(true);
        try {
            await verifyOTP(id, enteredOtp);
            toast.success('Customer OTP Verified Successfully!');
            setIsOtpModalOpen(false);
            setCurrentStep('complete');
            await loadDetail();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setResendingOtp(true);
        try {
            await generateOTP(id);
            toast.success('New OTP sent to customer');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResendingOtp(false);
        }
    };

    // Complete entire task
    const handleCompleteTask = async () => {
        try {
            await completeMeasurement(id);
            toast.success('Measurement task completed successfully!');
            navigate('/executive/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete task');
        }
    };

    // Cancel task
    const handleCancelTask = async () => {
        if (!window.confirm('Are you sure you want to cancel this measurement task? It will be re-assigned to another available executive.')) {
            return;
        }
        try {
            await rejectRequest(id);
            toast.success('Task cancelled and returned to pool.');
            navigate('/executive/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel task');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF8FC] flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-3xl bg-[#581C87] flex items-center justify-center text-white shadow-xl shadow-purple-900/20 animate-pulse mb-4">
                    <Sparkles size={28} />
                </div>
                <h3 className="text-base font-serif font-bold text-gray-900">SewZella</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Loading Tailoring Measurement...</p>
            </div>
        );
    }

    if (!request) return null;

    const activeItem = items.find((it) => it.id === activeTabId) || items[0];
    const isBottomActive = activeItem?.type === 'bottom' || /pajama|pant|trouser|salwar|bottom|plazo|palazzo|skirt/i.test(activeItem?.name || '');
    const activeFields = isBottomActive ? STANDARD_BOTTOM_FIELDS : STANDARD_KAMEEZ_FIELDS;
    const activeCustomFields = customFieldsByItem[activeTabId] || [];
    const activeValues = measurementsByItem[activeTabId] || {};

    const itemHeading = (() => {
        if (!activeItem) return 'Top (Kameez)';
        const raw = activeItem.name || 'Garment';
        if (/kameez|kurta|shirt|blouse|suit|pajama|pant|trouser|salwar|bottom|plazo|palazzo/i.test(raw)) {
            return raw;
        }
        return `${raw} (${isBottomActive ? 'Bottom' : 'Top'})`;
    })();

    const isAssignedPending = ['assigned', 'pending'].includes(request.status);

    return (
        <div className="min-h-screen bg-[#FDFCFE] text-gray-900 pb-28 md:pb-12 flex flex-col items-center">
            {/* Top mobile width constraint for pixel-accurate mobile presentation */}
            <div className="w-full max-w-xl mx-auto flex flex-col min-h-screen bg-[#FDFCFE] shadow-[0_0_50px_rgba(0,0,0,0.03)] border-x border-gray-100/60">
                
                {/* 1. TOP APP BAR */}
                <Header 
                    customerPhone={request.customer?.phoneNumber}
                    onCancelTask={['assigned', 'accepted'].includes(request.status) ? handleCancelTask : null}
                />

                {/* Accept Task Banner if not accepted yet */}
                {isAssignedPending && (
                    <div className="mx-4 mt-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#581C87] text-white flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900">New Assigned Task</p>
                                <p className="text-[11px] text-gray-500 truncate">Accept to begin customer measurement</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={accepting}
                            className="px-4 py-2 bg-[#581C87] hover:bg-[#4A154B] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer flex-shrink-0"
                        >
                            {accepting ? 'Accepting...' : 'Accept Task'}
                        </button>
                    </div>
                )}

                <div className="px-4 pt-3 pb-6 flex flex-col gap-4 flex-1">
                    {/* 2. CUSTOMER ORDER CARD */}
                    <CustomerCard 
                        customer={request.customer}
                        customerAddress={request.customerAddress}
                        order={request.order}
                        onCardClick={() => setIsCustomerModalOpen(true)}
                    />

                    {/* 3. ORDER PROGRESS STEPPER */}
                    <ProgressStepper 
                        currentStep={currentStep}
                        onStepClick={(stepId) => {
                            if (stepId === 'confirm' && (request.status === 'otp_sent' || request.status === 'measurements_uploaded')) {
                                setIsOtpModalOpen(true);
                            }
                            setCurrentStep(stepId);
                        }}
                    />

                    {/* STEPPER STEP: CONFIRM (OTP VERIFICATION) VIEW */}
                    {currentStep === 'confirm' && (
                        <div className="w-full bg-white rounded-[26px] p-6 border border-purple-200/80 shadow-lg shadow-purple-900/5 text-center my-2 animate-in fade-in zoom-in-95">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F3E8FF] text-[#581C87] flex items-center justify-center mb-3">
                                <ClipboardList size={26} strokeWidth={2.2} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Customer Sign-Off</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                Measurements have been uploaded. Enter the 6-digit OTP provided by {request.customer?.name || 'the customer'} to confirm.
                            </p>

                            <button
                                type="button"
                                onClick={() => setIsOtpModalOpen(true)}
                                className="mt-5 w-full py-3.5 px-6 bg-[#581C87] hover:bg-[#4A154B] text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-900/20 transition-all cursor-pointer active:scale-[0.98]"
                            >
                                Enter OTP Code
                            </button>

                            <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep('measuring')}
                                    className="text-gray-500 hover:text-[#581C87] underline cursor-pointer"
                                >
                                    ← Review Measurements
                                </button>
                                <span className="text-gray-300">•</span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendingOtp}
                                    className="text-[#581C87] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <RotateCw size={12} className={resendingOtp ? 'animate-spin' : ''} />
                                    <span>Resend OTP</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEPPER STEP: COMPLETE VIEW */}
                    {currentStep === 'complete' && (
                        <div className="w-full bg-white rounded-[26px] p-6 border border-emerald-200 shadow-lg shadow-emerald-900/5 text-center my-2 animate-in fade-in zoom-in-95">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                                <CheckCircle size={32} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Measurements Confirmed!</h3>
                            <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                                The customer has verified their tailoring measurements. You can now finalize and close this task.
                            </p>

                            <button
                                type="button"
                                onClick={handleCompleteTask}
                                className="mt-6 w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-[0.98]"
                            >
                                Mark Task as Complete
                            </button>

                            <button
                                type="button"
                                onClick={() => setCurrentStep('measuring')}
                                className="mt-3 text-xs font-semibold text-gray-500 hover:text-gray-800 underline cursor-pointer"
                            >
                                View Measurement Sheet
                            </button>
                        </div>
                    )}

                    {/* MEASURING SCREEN (PRIMARY) */}
                    {(currentStep === 'measuring' || currentStep === 'arrived' || currentStep === 'confirm') && (
                        <>
                            {/* 4. ITEM TABS */}
                            <ItemTabs 
                                items={items}
                                activeTabId={activeTabId}
                                onSelectTab={(id) => setActiveTabId(id)}
                                onAddItem={() => setIsAddItemModalOpen(true)}
                            />

                            {/* 5 & 6. MAIN MEASUREMENT SECTION: 2-COLUMN LAYOUT */}
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
                                
                                {/* LEFT: Measurement Form */}
                                <div className="bg-white rounded-[26px] p-3.5 border border-gray-100/90 shadow-[0_4px_24px_rgba(74,21,75,0.04)] flex flex-col">
                                    {/* Heading */}
                                    <div className="px-2 pt-1 pb-2">
                                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                            {itemHeading}
                                        </h3>
                                    </div>

                                    {/* Measurements List */}
                                    <div className="space-y-0.5">
                                        {activeFields.map((field) => (
                                            <MeasurementRow 
                                                key={field.key}
                                                itemKey={field.key}
                                                label={field.label}
                                                value={activeValues[field.key]}
                                                guideNumber={field.guideNumber}
                                                instruction={field.instruction}
                                                isHighlighted={highlightedFieldKey === field.key}
                                                onChange={(val) => handleMeasurementChange(field.key, val)}
                                            />
                                        ))}

                                        {/* Dynamic Custom Fields for this tab */}
                                        {activeCustomFields.map((field) => (
                                            <MeasurementRow 
                                                key={field.key}
                                                itemKey={field.key}
                                                label={field.label}
                                                value={activeValues[field.key]}
                                                unit={field.unit || 'in'}
                                                onChange={(val) => handleMeasurementChange(field.key, val)}
                                            />
                                        ))}
                                    </div>

                                    {/* "+ Add Custom Measurement" Outlined Button */}
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomMeasurementModalOpen(true)}
                                        className="mt-3 w-full py-2.5 px-3 rounded-2xl border border-[#6C2E9C] text-[#6C2E9C] hover:bg-purple-50/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                                    >
                                        <Plus size={14} strokeWidth={2.5} />
                                        <span>Add Custom Measurement</span>
                                    </button>
                                </div>

                                {/* RIGHT: Measurement Guide Panel */}
                                <MeasurementGuide 
                                    onSelectGuideNumber={handleSelectGuideNumber}
                                    activeGuideNumber={activeGuideNumber}
                                />
                            </div>

                            {/* 7. NOTES SECTION */}
                            <div className="w-full bg-white rounded-[26px] p-4 border border-gray-100/90 shadow-[0_4px_24px_rgba(74,21,75,0.04)]">
                                <h3 className="text-xs font-bold text-gray-800 tracking-tight mb-2">
                                    Notes <span className="text-gray-400 font-normal">(Optional)</span>
                                </h3>

                                <div className="relative">
                                    <textarea
                                        rows={3}
                                        maxLength={200}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any notes about fitting, style or customer preferences..."
                                        className="w-full p-3.5 rounded-2xl border border-gray-200/90 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6C2E9C] focus:ring-2 focus:ring-purple-100 resize-none transition-all"
                                    />
                                    <span className="absolute bottom-2.5 right-3 text-[10px] font-semibold text-gray-400 select-none">
                                        {notes.length}/200
                                    </span>
                                </div>
                            </div>

                            {/* 8. REFERENCE IMAGES SECTION */}
                            <div className="w-full bg-white rounded-[26px] p-4 border border-gray-100/90 shadow-[0_4px_24px_rgba(74,21,75,0.04)]">
                                <ReferenceImages 
                                    images={referenceImages}
                                    onAddPhotos={handleAddPhotos}
                                    onRemovePhoto={handleRemovePhoto}
                                />
                            </div>

                            {/* 9. BOTTOM ACTION BAR */}
                            <BottomActions 
                                onSaveDraft={handleSaveDraft}
                                onSaveAndContinue={handleSaveAndContinue}
                                loading={uploading}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* MODALS */}
            <CustomerDetailsModal 
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                request={request}
            />

            <CustomMeasurementModal 
                isOpen={isCustomMeasurementModalOpen}
                onClose={() => setIsCustomMeasurementModalOpen(false)}
                onAdd={handleAddCustomMeasurement}
            />

            <AddItemModal 
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                onAdd={handleAddItem}
            />

            <OTPModal 
                isOpen={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                verifying={verifying}
                resending={resendingOtp}
            />
        </div>
    );
};

export default RequestDetail;
