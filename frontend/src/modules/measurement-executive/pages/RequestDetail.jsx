import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { MapPin, Phone, User, CheckCircle, Upload, Navigation, Clock, Landmark, Scissors, FileText, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import DeliveryBoyLiveMap from '../../../shared/components/DeliveryBoyLiveMap';
import { useJsApiLoader } from '@react-google-maps/api';
import {
    isHeadingField,
    getInputFields,
    getFieldKey,
    sanitizeMeasurementFields,
} from '../../../utils/measurementFields';
import MeasurementDataDisplay from '../../../components/Common/MeasurementDataDisplay';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const CATEGORY_FIELDS_FALLBACK = {
    kurta: [
        { key: 'chest', label: 'Chest / Bust', placeholder: '34', isRequired: true },
        { key: 'waist', label: 'Waist', placeholder: '28', isRequired: true },
        { key: 'hips', label: 'Hips', placeholder: '36', isRequired: true },
        { key: 'shoulder', label: 'Shoulder', placeholder: '14', isRequired: true },
        { key: 'length', label: 'Full Length', placeholder: '40', isRequired: true },
        { key: 'sleeveLength', label: 'Sleeve Length', placeholder: '16', isRequired: false },
        { key: 'neck', label: 'Neck Depth', placeholder: '6', isRequired: false },
    ],
    shirt: [
        { key: 'chest', label: 'Chest / Bust', placeholder: '38', isRequired: true },
        { key: 'waist', label: 'Waist', placeholder: '34', isRequired: true },
        { key: 'shoulder', label: 'Shoulder', placeholder: '17', isRequired: true },
        { key: 'length', label: 'Full Length', placeholder: '30', isRequired: true },
        { key: 'sleeveLength', label: 'Sleeve Length', placeholder: '24', isRequired: true },
        { key: 'neck', label: 'Collar Size', placeholder: '15', isRequired: false },
    ],
    blouse: [
        { key: 'chest', label: 'Bust / Chest', placeholder: '34', isRequired: true },
        { key: 'underbust', label: 'Underbust', placeholder: '30', isRequired: true },
        { key: 'shoulder', label: 'Shoulder', placeholder: '14', isRequired: true },
        { key: 'length', label: 'Blouse Length', placeholder: '14', isRequired: true },
        { key: 'frontNeck', label: 'Front Neck Depth', placeholder: '7', isRequired: false },
        { key: 'backNeck', label: 'Back Neck Depth', placeholder: '8', isRequired: false },
        { key: 'sleeveLength', label: 'Sleeve Length', placeholder: '10', isRequired: false },
    ],
    pant: [
        { key: 'waist', label: 'Waist', placeholder: '32', isRequired: true },
        { key: 'hips', label: 'Hips', placeholder: '38', isRequired: true },
        { key: 'length', label: 'Full Length / Inseam', placeholder: '40', isRequired: true },
        { key: 'thigh', label: 'Thigh Width', placeholder: '22', isRequired: false },
        { key: 'bottom', label: 'Bottom Opening', placeholder: '14', isRequired: false },
    ],
    trouser: [
        { key: 'waist', label: 'Waist', placeholder: '32', isRequired: true },
        { key: 'hips', label: 'Hips', placeholder: '38', isRequired: true },
        { key: 'length', label: 'Full Length / Inseam', placeholder: '40', isRequired: true },
        { key: 'thigh', label: 'Thigh Width', placeholder: '22', isRequired: false },
        { key: 'bottom', label: 'Bottom Opening', placeholder: '14', isRequired: false },
    ],
    skirt: [
        { key: 'waist', label: 'Waist', placeholder: '28', isRequired: true },
        { key: 'hips', label: 'Hips', placeholder: '36', isRequired: true },
        { key: 'length', label: 'Full Length', placeholder: '38', isRequired: true },
    ],
};

const DEFAULT_FALLBACK_FIELDS = ['chest', 'waist', 'hips', 'shoulder', 'length', 'neck', 'sleeve', 'inseam'].map(
    (f) => ({ key: f, label: f, placeholder: '0.0', isRequired: true })
);

const resolveFieldsForService = (item) => {
    const custom = item?.service?.category?.measurementFields;
    if (Array.isArray(custom) && custom.length > 0) return custom;
    const name = (
        item?.service?.category?.name ||
        item?.service?.title ||
        item?.service?.name ||
        ''
    ).toLowerCase();
    const matchKey = Object.keys(CATEGORY_FIELDS_FALLBACK).find((k) => name.includes(k));
    if (matchKey) return CATEGORY_FIELDS_FALLBACK[matchKey];
    return DEFAULT_FALLBACK_FIELDS;
};

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getRequestDetail, generateOTP, verifyOTP, uploadMeasurements, completeMeasurement, rejectRequest } = useMeasurementStore();
    
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    
    const [currentLocation, setCurrentLocation] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [settings, setSettings] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES
    });
    
    // Per booked-service measurement values: { [itemIndex]: { fieldKey: value } }
    const [itemForms, setItemForms] = useState({});
    const [notes, setNotes] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    const serviceItems = useMemo(() => {
        const items = request?.order?.items || [];
        const withService = items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item?.service);
        if (withService.length > 0) return withService;
        return items.length ? [{ item: items[0], index: 0 }] : [];
    }, [request]);

    const itemSchemas = useMemo(
        () =>
            serviceItems.map(({ item, index }) => {
                const fields = resolveFieldsForService(item);
                const layout = sanitizeMeasurementFields(fields);
                const title =
                    item?.service?.title ||
                    item?.service?.name ||
                    item?.service?.category?.name ||
                    `Item ${index + 1}`;
                const hasCustom =
                    Array.isArray(item?.service?.category?.measurementFields) &&
                    item.service.category.measurementFields.length > 0;
                return { index, item, title, fields, layout, hasCustom };
            }),
        [serviceItems]
    );

    useEffect(() => {
        loadDetail();
        api.get('/cms/settings')
            .then(res => {
                if(res.data.success) setSettings(res.data.data);
            })
            .catch(err => console.error('Failed to load settings:', err));
    }, [id]);

    useEffect(() => {
        if (!itemSchemas.length) return;
        setItemForms((prev) => {
            const next = {};
            itemSchemas.forEach(({ index, fields }) => {
                const prevVals = prev[index] || {};
                const empty = {};
                getInputFields(fields).forEach((f) => {
                    const key = getFieldKey(f);
                    empty[key] = prevVals[key] ?? '';
                });
                next[index] = empty;
            });
            return next;
        });
    }, [itemSchemas]);

    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.error('Location error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const loadDetail = async () => {
        try {
            const data = await getRequestDetail(id);
            setRequest(data);
        } catch (error) {
            if (error.name === 'CanceledError') return;
            console.error("GET REQUEST DETAIL ERROR:", error);
            toast.error(`Failed: ${error.response?.data?.message || error.message}`);
            navigate('/executive/requests');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateOTP = async () => {
        try {
            await generateOTP(id);
            toast.success('OTP sent to customer');
            loadDetail();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setVerifying(true);
        try {
            await verifyOTP(id, otp);
            toast.success('OTP Verified!');
            loadDetail();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setVerifying(false);
        }
    };

    const updateItemField = (itemIndex, fieldKey, value) => {
        setItemForms((prev) => ({
            ...prev,
            [itemIndex]: {
                ...(prev[itemIndex] || {}),
                [fieldKey]: value,
            },
        }));
    };

    const validateForms = () => {
        for (const schema of itemSchemas) {
            const values = itemForms[schema.index] || {};
            for (const field of getInputFields(schema.fields)) {
                if (field.isRequired === false) continue;
                const key = getFieldKey(field);
                const val = values[key];
                if (val === undefined || val === null || String(val).trim() === '') {
                    toast.error(`Please fill ${field.label || key} (${schema.title})`);
                    return false;
                }
            }
        }
        return true;
    };

    const buildSubmitFormData = () => {
        const multi = itemSchemas.length > 1;
        const itemsPayload = itemSchemas.map((schema) => {
            const raw = itemForms[schema.index] || {};
            const values = {};
            getInputFields(schema.fields).forEach((f) => {
                const key = getFieldKey(f);
                if (raw[key] !== undefined && raw[key] !== '') values[key] = raw[key];
            });
            return {
                index: schema.index,
                title: schema.title,
                categoryName: schema.item?.service?.category?.name || '',
                measurementLayout: schema.layout,
                values,
            };
        });

        const primary = itemsPayload[0] || { values: {}, measurementLayout: [] };
        const formData = {
            ...primary.values,
            measurementLayout: primary.measurementLayout,
        };

        if (multi) {
            formData.__multi = true;
            formData.items = itemsPayload;
            itemsPayload.forEach((entry, i) => {
                Object.entries(entry.values).forEach(([k, v]) => {
                    formData[`item${i}_${k}`] = v;
                });
            });
        }

        return formData;
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!validateForms()) return;
        setUploading(true);
        try {
            // Upload PDF if exists
            let pdfUrl = '';
            if (pdfFile) {
                const pdfData = new FormData();
                pdfData.append('image', pdfFile);
                pdfData.append('folder', 'measurements/pdfs');
                const pdfRes = await api.post('/upload', pdfData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if(pdfRes.data.success) pdfUrl = pdfRes.data.data;
            }

            // Upload Photos if exist
            let photoUrls = [];
            if (photos.length > 0) {
                const photoData = new FormData();
                photos.forEach(p => photoData.append('images', p));
                photoData.append('folder', 'measurements/photos');
                const photoRes = await api.post('/upload/bulk', photoData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if(photoRes.data.success) photoUrls = photoRes.data.data;
            }

            await uploadMeasurements(id, {
                formData: buildSubmitFormData(),
                notes,
                pdfUrl,
                photos: photoUrls,
                unit: 'inches'
            });

            toast.success('Measurements uploaded successfully!');
            loadDetail();
        } catch (error) {
            toast.error('Failed to upload measurements');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleComplete = async () => {
        try {
            await completeMeasurement(id);
            toast.success('Measurement task completed!');
            navigate('/executive/requests');
        } catch (error) {
            toast.error('Failed to complete');
        }
    };

    const handleCancelTask = async () => {
        if (!window.confirm('Are you sure you want to cancel this measurement task? It will be automatically reassigned to another available executive.')) {
            return;
        }

        try {
            toast.loading('Cancelling and reassigning task...', { id: 'cancel-detail-task' });
            await rejectRequest(id);
            toast.success('Task cancelled. Reassigned to another executive.', { id: 'cancel-detail-task' });
            navigate('/executive/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel task', { id: 'cancel-detail-task' });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!request) return null;

    const mapsUrl = request.customerLocation?.coordinates 
        ? `https://www.google.com/maps/dir/?api=1&destination=${request.customerLocation.coordinates[1]},${request.customerLocation.coordinates[0]}`
        : null;

    const baseFee = settings?.executiveRates?.baseFee || 50;
    const perKmRate = settings?.executiveRates?.perKmRate || 15;
    const distanceKm = (routeData?.distanceValue || 0) / 1000;
    const estimatedEarnings = Math.round(baseFee + (distanceKm * perKmRate));

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#843D9B] flex items-center justify-center text-white shadow-lg shadow-purple-200">
                        <Navigation size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Request Details</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage active task</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {['assigned', 'accepted', 'otp_sent'].includes(request.status) && (
                        <button
                            onClick={handleCancelTask}
                            className="px-4 py-2 rounded-xl flex items-center gap-1.5 font-black text-xs uppercase tracking-widest bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-colors shadow-sm cursor-pointer"
                        >
                            <X size={14} /> Cancel Task
                        </button>
                    )}
                    <div className="px-4 py-2 rounded-xl flex items-center gap-2 border font-black text-xs uppercase tracking-widest shadow-sm bg-blue-50 text-blue-600 border-blue-100">
                        {request.status.replace('_', ' ')}
                    </div>
                </div>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white shadow-xl shadow-gray-200/40 rounded-[2rem] border border-gray-100 mb-8 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-purple-50/50 to-white">
                    <h3 className="text-lg font-black text-gray-900">Customer Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-[#843D9B]">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Name</p>
                            <p className="text-sm font-black text-gray-900">{request.customer?.name}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Order: {request.order?.orderId}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-sky-500">
                            <Phone size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Number</p>
                            <p className="text-sm font-medium text-gray-900">{request.customer?.phoneNumber}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex items-start gap-4 transition-all hover:bg-gray-50 hover:shadow-md md:col-span-2">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-emerald-500">
                            <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Address</p>
                            <p className="text-sm font-medium text-gray-900 leading-relaxed mb-3">
                                {request.customerAddress?.street}, {request.customerAddress?.city}, {request.customerAddress?.state} {request.customerAddress?.zipCode}
                            </p>
                            {mapsUrl && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                                        <Navigation className="h-3.5 w-3.5 text-sky-500" />
                                        {request.distance ? `${request.distance} km` : 'N/A'}
                                    </div>
                                    <a 
                                        href={mapsUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                                    >
                                        <Navigation className="h-3.5 w-3.5" />
                                        Navigate
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tailor Info Card */}
            {request.tailor && (
                <div className="bg-white shadow-xl shadow-gray-200/40 rounded-[2rem] border border-gray-100 mb-8 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 to-white">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-indigo-500" />
                            Assigned Tailor
                        </h3>
                        <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Measurements {request.status === 'completed' ? 'have been sent' : 'will be sent'} to this tailor</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4 shadow-sm">
                            {request.tailor?.profileImage ? (
                                <img src={request.tailor.profileImage} alt="" className="h-12 w-12 rounded-xl object-cover" />
                            ) : (
                                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-indigo-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-black text-gray-900">{request.tailor?.shopName || request.tailor?.name || 'Tailor Partner'}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tailor Partner</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4 shadow-sm">
                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Phone className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900">{request.tailor?.phoneNumber}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Contact Number</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Map & Stats */}
            {request.status !== 'measurements_uploaded' && (
                <div className="bg-white shadow-xl shadow-gray-200/40 rounded-[2rem] border border-gray-100 mb-8 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                            <Navigation className="h-5 w-5 text-indigo-600" />
                            Live Navigation
                        </h3>
                        {routeData && (
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><Navigation size={12} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Distance</span>
                                        <span className="text-xs font-black text-slate-800 leading-none mt-1">{routeData.distance}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Clock size={12} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Time</span>
                                        <span className="text-xs font-black text-slate-800 leading-none mt-1">{routeData.duration}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><Landmark size={12} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Earning</span>
                                        <span className="text-xs font-black text-emerald-600 leading-none mt-1">₹{estimatedEarnings}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50/50">
                        <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                            <DeliveryBoyLiveMap 
                                currentLocation={currentLocation}
                                destination={request.customerLocation?.coordinates ? {
                                    lat: request.customerLocation.coordinates[1],
                                    lng: request.customerLocation.coordinates[0]
                                } : null}
                                destinationAddress={`${request.customerAddress?.street}, ${request.customerAddress?.city}`}
                                isLoaded={isLoaded}
                                height="300px"
                                onRouteCalculated={(data) => setRouteData(data)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Steps Container */}
            <div className="space-y-8">
                {/* STEP 1: Take Measurements */}
                {request.status === 'accepted' && (
                    <div className="bg-white shadow-xl shadow-purple-200/40 rounded-[2rem] p-6 sm:p-8 border-2 border-purple-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#843D9B]"></div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-[#843D9B] text-white h-10 w-10 rounded-xl flex items-center justify-center font-black shadow-lg shadow-purple-200">1</div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Take Measurements</h3>
                        </div>
                        
                        {itemSchemas.length === 0 ? (
                            <p className="text-sm text-gray-500 mb-6">No service found on this order — cannot load measurement form.</p>
                        ) : (
                            <div className="space-y-8 mb-6">
                                {itemSchemas.map((schema) => (
                                    <div key={schema.index} className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full text-xs font-extrabold text-[#843D9B]">
                                                <Scissors size={12} />
                                                {schema.title}
                                                {schema.item?.service?.category?.name &&
                                                    schema.item.service.category.name !== schema.title && (
                                                        <span className="text-[10px] font-bold text-purple-400">
                                                            · {schema.item.service.category.name}
                                                        </span>
                                                    )}
                                            </div>
                                            {schema.hasCustom && (
                                                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-full font-bold">
                                                    Service form
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {schema.fields.map((field, fIdx) => {
                                                if (isHeadingField(field)) {
                                                    return (
                                                        <div
                                                            key={`h-${schema.index}-${fIdx}-${field.label}`}
                                                            className="col-span-2 md:col-span-4 pt-2 first:pt-0"
                                                        >
                                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#843D9B] border-b border-[#843D9B]/15 pb-1.5">
                                                                {field.label}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                const key = getFieldKey(field);
                                                return (
                                                    <div
                                                        key={`${schema.index}-${key}-${fIdx}`}
                                                        className="bg-gray-50 p-3 rounded-2xl border border-gray-100 focus-within:border-[#843D9B] focus-within:ring-2 focus-within:ring-purple-100 transition-all"
                                                    >
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                                            {field.label || key}
                                                            {field.isRequired === false ? (
                                                                <span className="normal-case text-gray-400 font-medium"> (optional)</span>
                                                            ) : null}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            placeholder={field.placeholder || '0.0'}
                                                            className="block w-full bg-transparent border-0 p-0 text-sm font-black text-gray-900 focus:ring-0"
                                                            value={itemForms[schema.index]?.[key] ?? ''}
                                                            onChange={(e) =>
                                                                updateItemField(schema.index, key, e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mb-8">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1">Notes</label>
                            <textarea
                                rows="3"
                                className="block w-full text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-purple-100 focus:border-[#843D9B] transition-all resize-none shadow-inner"
                                placeholder="Any specific requirements from customer..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1">Upload Report (PDF)</label>
                                {pdfFile ? (
                                    <div className="flex items-center justify-between p-4 border-2 border-indigo-100 rounded-2xl bg-indigo-50/50 shadow-sm">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <span className="text-sm font-bold text-indigo-900 truncate">{pdfFile.name}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setPdfFile(null)}
                                            className="p-2 bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-xl transition-all shadow-sm"
                                        >
                                            <span className="sr-only">Remove</span>
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-[#843D9B] transition-colors bg-gray-50 hover:bg-purple-50/30">
                                        <div className="space-y-1 text-center">
                                            <div className="mx-auto h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                                                <Upload className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-black text-[#843D9B] hover:text-[#6b2f81] focus-within:outline-none uppercase tracking-widest text-[11px]">
                                                    <span>Upload a file</span>
                                                    <input type="file" accept=".pdf" className="sr-only" onChange={(e) => setPdfFile(e.target.files[0])} />
                                                </label>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 pl-1">Reference Photos</label>
                                {photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="relative group rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-square bg-gray-100">
                                                <img 
                                                    src={URL.createObjectURL(photo)} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                                        className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-50 shadow-lg transform scale-90 group-hover:scale-100 transition-all font-black text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {photos.length < 4 && (
                                            <label className="relative cursor-pointer border-2 border-gray-200 border-dashed rounded-2xl flex flex-col items-center justify-center aspect-square hover:border-[#843D9B] bg-gray-50 hover:bg-purple-50/30 transition-colors">
                                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#843D9B]">Add Photo</span>
                                                <input type="file" multiple accept="image/*" className="sr-only" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)])} />
                                            </label>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-[#843D9B] transition-colors bg-gray-50 hover:bg-purple-50/30">
                                        <div className="space-y-1 text-center">
                                            <div className="mx-auto h-12 w-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                                                <Upload className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-black text-[#843D9B] hover:text-[#6b2f81] focus-within:outline-none uppercase tracking-widest text-[11px]">
                                                    <span>Upload photos</span>
                                                    <input type="file" multiple accept="image/*" className="sr-only" onChange={(e) => setPhotos(Array.from(e.target.files))} />
                                                </label>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg shadow-purple-200 text-xs uppercase tracking-widest font-black text-white bg-[#843D9B] hover:bg-[#6b2f81] transition-all disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {uploading ? 'Uploading...' : 'Submit Measurements'}
                        </button>
                    </div>
                )}

                {/* STEP 2: Verify Customer */}
                {(request.status === 'measurements_uploaded' || request.status === 'otp_sent') && (
                    <div className="bg-white shadow-xl shadow-indigo-200/40 rounded-[2rem] p-6 sm:p-8 border-2 border-indigo-100 relative overflow-hidden mt-6">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-500 text-white h-10 w-10 rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-200">2</div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Customer Confirmation</h3>
                        </div>
                        
                        {request.status === 'measurements_uploaded' ? (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">Measurements saved! Generate an OTP to have the customer confirm and sign-off on these measurements.</p>
                                <button
                                    onClick={handleGenerateOTP}
                                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Generate OTP
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">OTP has been sent to the customer's app. Please ask and enter it below.</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all shadow-inner">
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full bg-transparent border-0 px-2 py-1 text-base font-black text-center tracking-[0.5em] focus:ring-0"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleVerifyOTP}
                                        disabled={verifying || !otp}
                                        className="sm:w-32 py-3 px-4 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {verifying ? 'Verifying' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Complete */}
                {request.status === 'otp_verified' && (
                    <div className="bg-white shadow-xl shadow-emerald-200/40 rounded-[2rem] p-8 sm:p-12 border-2 border-emerald-100 text-center mt-6">
                        <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Customer Verified!</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8 max-w-md mx-auto">The tailor has been notified of the confirmed measurements. You can now close this request and proceed to your next task.</p>
                        <button onClick={handleComplete} className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0">
                            Mark Task as Complete
                        </button>
                    </div>
                )}

                {/* COMPLETED STATE */}
                {request.status === 'completed' && request.report && (
                    <div className="bg-white shadow-xl shadow-emerald-200/40 rounded-[2rem] overflow-hidden border-2 border-emerald-100 mt-6 relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-br from-emerald-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Task Completed</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Measurements processed</p>
                                </div>
                            </div>
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 shadow-sm">
                                Successfully Sent
                            </span>
                        </div>
                        <div className="p-6 sm:p-8">
                            <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Submitted Measurements
                            </h4>
                            {(() => {
                                const raw = request.report.formData || {};
                                const fd =
                                    raw instanceof Map ? Object.fromEntries(raw) : raw;
                                const multiItems = Array.isArray(fd.items) ? fd.items : null;

                                if (multiItems?.length) {
                                    return (
                                        <div className="space-y-6 mb-8">
                                            {multiItems.map((entry, i) => (
                                                <div key={i} className="space-y-2">
                                                    <p className="text-xs font-black text-[#843D9B]">
                                                        {entry.title || `Item ${i + 1}`}
                                                    </p>
                                                    <MeasurementDataDisplay
                                                        measurements={entry.values || {}}
                                                        layoutFields={entry.measurementLayout}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="mb-8">
                                        <MeasurementDataDisplay
                                            measurements={fd}
                                            layoutFields={fd.measurementLayout}
                                        />
                                    </div>
                                );
                            })()}
                            
                            {request.report.notes && (
                                <div className="mb-8">
                                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Notes</h4>
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 relative">
                                        <div className="absolute top-4 left-4 text-amber-200 font-serif text-4xl leading-none">"</div>
                                        <p className="text-sm font-medium text-amber-900 italic relative z-10 pl-6 pr-2 py-1">{request.report.notes}</p>
                                    </div>
                                </div>
                            )}

                            {(request.report.photos?.length > 0 || request.report.pdfUrl) && (
                                <div>
                                    <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Attachments</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {request.report.photos?.map((photo, i) => (
                                            <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm hover:border-[#843D9B] hover:shadow-md transition-all group">
                                                <img src={photo} alt="Measurement" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </a>
                                        ))}
                                        {request.report.pdfUrl && (
                                            <a href={request.report.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-red-50 text-red-500 border-2 border-red-100 shadow-sm hover:border-red-400 hover:shadow-md hover:bg-red-100 transition-all gap-2 group">
                                                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    <FileText className="h-6 w-6" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestDetail;
