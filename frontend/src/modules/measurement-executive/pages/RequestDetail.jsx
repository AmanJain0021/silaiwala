import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { MapPin, Phone, User, CheckCircle, Upload, Navigation, Clock, Landmark, Scissors, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import DeliveryBoyLiveMap from '../../../shared/components/DeliveryBoyLiveMap';
import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getRequestDetail, generateOTP, verifyOTP, uploadMeasurements, completeMeasurement } = useMeasurementStore();
    
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
    
    // Measurement Form State
    const [formData, setFormData] = useState({
        chest: '', waist: '', hips: '', shoulder: '', length: '', neck: '', sleeve: '', inseam: ''
    });
    const [notes, setNotes] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadDetail();
        api.get('/cms/settings')
            .then(res => {
                if(res.data.success) setSettings(res.data.data);
            })
            .catch(err => console.error('Failed to load settings:', err));
    }, [id]);

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

    const handleUpload = async (e) => {
        e.preventDefault();
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

            // Submit Measurement Data
            await uploadMeasurements(id, {
                formData,
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

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Request Detail</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                    {request.status.replace('_', ' ')}
                </span>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Details</h3>
                </div>
                <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start">
                        <User className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{request.customer?.name}</p>
                            <p className="text-sm text-gray-500">Order: {request.order?.orderId}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Phone className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <p className="text-sm text-gray-900 mt-1">{request.customer?.phoneNumber}</p>
                    </div>
                    <div className="flex items-start md:col-span-2">
                        <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                            <p className="text-sm text-gray-900 mb-3">
                                {request.customerAddress?.street}, {request.customerAddress?.city}, {request.customerAddress?.state} {request.customerAddress?.zipCode}
                            </p>
                            {mapsUrl && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                                        <Navigation className="h-3.5 w-3.5 text-sky-500" />
                                        {request.distance ? `${request.distance} km` : 'N/A'}
                                    </div>
                                    <a 
                                        href={mapsUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
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
                <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-indigo-500" />
                            Assigned Tailor Details
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">Measurements {request.status === 'completed' ? 'have been sent' : 'will be sent'} to this tailor.</p>
                    </div>
                    <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
                        <div className="flex items-center">
                            {request.tailor?.profileImage ? (
                                <img src={request.tailor.profileImage} alt="" className="h-10 w-10 rounded-full mr-3 object-cover" />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                    <User className="h-5 w-5 text-indigo-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900">{request.tailor?.name}</p>
                                <p className="text-xs text-gray-500">Tailor Partner</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                                <Phone className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{request.tailor?.phoneNumber}</p>
                                <p className="text-xs text-gray-500">Contact Number</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Map & Stats */}
            {request.status !== 'measurements_uploaded' && (
                <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                    <div className="px-4 py-4 border-b border-gray-200 sm:px-6 bg-slate-50 flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-indigo-600" />
                            Live Navigation
                        </h3>
                        {routeData && (
                            <div className="flex gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Distance</span>
                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                        <Navigation className="h-3.5 w-3.5 text-blue-500" />
                                        {routeData.distance}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Time</span>
                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                                        {routeData.duration}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Est. Earning</span>
                                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                        <Landmark className="h-3.5 w-3.5" />
                                        ₹{estimatedEarnings}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50">
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
            )}

            {/* Steps Container */}
            <div className="space-y-8">
                               {/* STEP 1: Take Measurements */}
                {request.status === 'accepted' && (
                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-100 text-indigo-700 h-8 w-8 rounded-full flex items-center justify-center font-bold">1</div>
                            <h3 className="text-lg font-medium text-gray-900">Take Measurements</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {['chest', 'waist', 'hips', 'shoulder', 'length', 'neck', 'sleeve', 'inseam'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700 capitalize mb-1">{field}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0.0"
                                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                        value={formData[field] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                rows="2"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="Any specific requirements from customer..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Report (PDF)</label>
                                {pdfFile ? (
                                    <div className="flex items-center justify-between p-3 border-2 border-indigo-100 rounded-lg bg-indigo-50">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <span className="text-sm font-medium text-indigo-900 truncate">{pdfFile.name}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setPdfFile(null)}
                                            className="p-1.5 bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-sm"
                                        >
                                            <span className="sr-only">Remove</span>
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors bg-gray-50 hover:bg-indigo-50/30">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input type="file" accept=".pdf" className="sr-only" onChange={(e) => setPdfFile(e.target.files[0])} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500">PDF up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Photos</label>
                                {photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-square bg-gray-100">
                                                <img 
                                                    src={URL.createObjectURL(photo)} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                                                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {photos.length < 4 && (
                                            <label className="relative cursor-pointer border-2 border-gray-300 border-dashed rounded-lg flex flex-col items-center justify-center aspect-square hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50/30 transition-colors">
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <span className="text-xs font-medium text-indigo-600">Add Photo</span>
                                                <input type="file" multiple accept="image/*" className="sr-only" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)])} />
                                            </label>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors bg-gray-50 hover:bg-indigo-50/30">
                                        <div className="space-y-1 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="flex text-sm text-gray-600 justify-center">
                                                <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                    <span>Upload photos</span>
                                                    <input type="file" multiple accept="image/*" className="sr-only" onChange={(e) => setPhotos(Array.from(e.target.files))} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 mt-4"
                        >
                            {uploading ? 'Uploading...' : 'Submit Measurements'}
                        </button>
                    </div>
                )}

                {/* STEP 2: Verify Customer */}
                {(request.status === 'measurements_uploaded' || request.status === 'otp_sent') && (
                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500 mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-100 text-indigo-700 h-8 w-8 rounded-full flex items-center justify-center font-bold">2</div>
                            <h3 className="text-lg font-medium text-gray-900">Customer Confirmation</h3>
                        </div>
                        
                        {request.status === 'measurements_uploaded' ? (
                            <div>
                                <p className="text-sm text-gray-500 mb-4">Measurements saved! Generate an OTP to have the customer confirm and sign-off on these measurements.</p>
                                <button
                                    onClick={handleGenerateOTP}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-medium"
                                >
                                    Generate OTP
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-500 mb-4">OTP has been sent to the customer's app. Please ask and enter it below.</p>
                                <div className="flex gap-2 max-w-xs">
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                    <button
                                        onClick={handleVerifyOTP}
                                        disabled={verifying || !otp}
                                        className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-medium disabled:opacity-50"
                                    >
                                        {verifying ? 'Verifying...' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Complete */}
                {request.status === 'otp_verified' && (
                    <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500 text-center mt-4">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Verified!</h3>
                        <p className="text-sm text-gray-500 mb-6">The tailor has been notified of the confirmed measurements. You can now close this request.</p>
                        <button onClick={handleComplete} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium shadow">
                            Mark Task as Complete
                        </button>
                    </div>
                )}

                {/* COMPLETED STATE */}
                {request.status === 'completed' && request.report && (
                    <div className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-emerald-500">
                        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center justify-between bg-emerald-50">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                                <h3 className="text-lg leading-6 font-bold text-emerald-800">Task Completed</h3>
                            </div>
                            <span className="text-sm text-emerald-600 font-medium">Measurement Sent Successfully</span>
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Submitted Measurements
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {Object.entries(request.report.formData || {}).map(([key, value]) => (
                                    <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-gray-500 capitalize">{key}</p>
                                        <p className="text-lg font-semibold text-slate-800">{value} <span className="text-xs font-normal text-gray-400">{request.report.unit || 'in'}</span></p>
                                    </div>
                                ))}
                            </div>
                            
                            {request.report.notes && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes</h4>
                                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 italic">"{request.report.notes}"</p>
                                </div>
                            )}

                            {(request.report.photos?.length > 0 || request.report.pdfUrl) && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Attachments</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {request.report.photos?.map((photo, i) => (
                                            <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all">
                                                <img src={photo} alt="Measurement" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                        {request.report.pdfUrl && (
                                            <a href={request.report.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-20 h-20 rounded-lg bg-red-50 text-red-500 border border-red-100 shadow-sm hover:ring-2 hover:ring-red-400 transition-all flex-col gap-1">
                                                <FileText className="h-6 w-6" />
                                                <span className="text-[10px] font-bold">PDF</span>
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
