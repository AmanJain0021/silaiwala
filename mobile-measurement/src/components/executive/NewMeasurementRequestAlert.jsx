// Port of modules/measurement-executive/components/NewMeasurementRequestAlert.jsx (converted with scripts/web2rn.js, then reviewed)
import { Animated, AppState, Linking, PanResponder, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import events from '../../lib/events';
import React, { useState, useEffect, useRef } from "react";
import { Ruler, MapPin, X, ArrowRight, Check, Package, Navigation, Phone, Clock, User } from "lucide-react-native";
import socket from "../../utils/socket";
import useMeasurementStore from "../../store/measurementExecutiveStore";
import api from "../../lib/api";
import toast from '../../lib/toast';
import { startRingtone, stopRingtone } from "../../utils/audioAlert";
import { Box, I, Txt, Btn, Scroll } from '../ui/primitives';
const startAlertAudio = () => {
  startRingtone();
};
const stopAlertAudio = () => {
  stopRingtone();
};
const formatAddress = addr => {
  if (!addr) return 'Address details pending';
  if (typeof addr === 'string') return addr.trim() || 'Address details pending';
  if (typeof addr === 'object') {
    const parts = [addr.street || addr.addressLine1 || addr.address || addr.houseNo, addr.landmark, addr.city, addr.state, addr.pincode || addr.zipCode || addr.zip].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  return 'Address details pending';
};
const extractCustomerName = data => {
  if (data.customerName && data.customerName !== 'Customer') return data.customerName;
  if (typeof data.customer === 'object' && data.customer?.name) return data.customer.name;
  if (data.order && typeof data.order === 'object' && data.order.customer?.name) return data.order.customer.name;
  if (typeof data.customer === 'string' && data.customer.length < 30) return data.customer;
  return 'Customer';
};
const extractCustomerPhone = data => {
  if (data.customerPhone && data.customerPhone !== 'N/A') return data.customerPhone;
  if (typeof data.customer === 'object' && data.customer?.phoneNumber) return data.customer.phoneNumber;
  if (data.order && typeof data.order === 'object' && data.order.customer?.phoneNumber) return data.order.customer.phoneNumber;
  return '';
};
const NewMeasurementRequestAlert = () => {
  const [request, setRequest] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const {
    acceptRequest,
    rejectRequest
  } = useMeasurementStore();
  const dismissedRequestsRef = useRef(new Set());
  const requestRef = useRef(null);
  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  // framer-motion drag="x" -> PanResponder + Animated (accept past 180px; narrow phones use the track's reach)
  const insets = useSafeAreaInsets();
  const x = useRef(new Animated.Value(0)).current;
  const maxX = useRef(260);
  const acceptRef = useRef(() => {});
  const textOpacity = x.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: 'clamp' });
  const checkOpacity = x.interpolate({ inputRange: [150, 190], outputRange: [0, 1], extrapolate: 'clamp' });
  const resetSwipe = () => Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4,
    onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(maxX.current, g.dx))),
    onPanResponderRelease: (_, g) => {
      if (g.dx > Math.min(180, maxX.current * 0.85)) acceptRef.current();
      else resetSwipe();
    },
    onPanResponderTerminate: () => resetSwipe(),
  })).current;

  // Audio Ringtone Lifecycle
  useEffect(() => {
    if (request) {
      startAlertAudio();
    } else {
      stopAlertAudio();
    }
    return () => {
      stopAlertAudio();
    };
  }, [request]);

  // Auto-timeout (45s) dismiss handler
  useEffect(() => {
    if (!request) return;
    const timer = setTimeout(() => {
      const reqId = request?._id || request?.requestId;
      if (reqId) dismissedRequestsRef.current.add(reqId.toString());
      setRequest(null);
      toast('Measurement request moved to requests list.', {
        icon: '📐',
        duration: 4000
      });
    }, 45000);
    return () => clearTimeout(timer);
  }, [request]);

  // Socket Event & FCM Listeners
  useEffect(() => {
    const handleNewSocketRequest = data => {
      console.log('📐 New Measurement Request Socket Event Received:', data);
      const reqId = data.requestId || data._id || data.id;
      if (reqId && dismissedRequestsRef.current.has(reqId.toString())) {
        return;
      }
      const rawAddr = data.address || data.customerAddress || data.order?.deliveryAddress;
      setRequest({
        _id: reqId,
        requestId: reqId,
        requestIdStr: data.requestIdStr || reqId,
        orderIdStr: data.orderIdStr || data.orderId || data.order?.orderId || 'N/A',
        customerName: extractCustomerName(data),
        customerPhone: extractCustomerPhone(data),
        address: formatAddress(rawAddr),
        distance: data.distance ? `${Number(data.distance).toFixed(1)} km` : null,
        scheduledTime: data.scheduledDate ? `${data.scheduledDate}${data.scheduledTimeSlot ? ' (' + data.scheduledTimeSlot + ')' : ''}` : data.scheduledTime ? new Date(data.scheduledTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }) : 'As soon as possible',
        earnings: data.earnings || data.payout || 150
      });
    };
    const handleFCMMessage = event => {
      const payload = event.detail?.data || {};
      if (payload.type === 'NEW_MEASUREMENT_REQUEST' || payload.type === 'MEASUREMENT_ASSIGNED') {
        handleNewSocketRequest(payload);
      }
    };
    if (socket) {
      socket.on('new_measurement_request', handleNewSocketRequest);
    }
    const offFcm = events.on('fcm_message', handleFCMMessage);
    return () => {
      if (socket) {
        socket.off('new_measurement_request', handleNewSocketRequest);
      }
      offFcm();
    };
  }, []);

  // Polling & Mount Fetch for Pending Measurement Requests
  useEffect(() => {
    const pollForRequests = async () => {
      if (request || isAccepting || AppState.currentState !== 'active') return;
      try {
        const res = await api.get('/measurement-executive/requests?status=pending');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const pendingList = res.data.data;
          const reqToShow = pendingList.find(r => {
            const idStr = (r._id || r.requestId || '').toString();
            return !dismissedRequestsRef.current.has(idStr);
          });
          if (reqToShow) {
            const reqId = reqToShow._id || reqToShow.requestId;
            const rawAddr = reqToShow.customerAddress || reqToShow.address || reqToShow.order?.deliveryAddress;
            setRequest({
              _id: reqId,
              requestId: reqId,
              requestIdStr: reqToShow.requestId || reqId,
              orderIdStr: reqToShow.order?.orderId || reqToShow.orderId || 'N/A',
              customerName: extractCustomerName(reqToShow),
              customerPhone: extractCustomerPhone(reqToShow),
              address: formatAddress(rawAddr),
              distance: reqToShow.distance ? `${Number(reqToShow.distance).toFixed(1)} km` : null,
              scheduledTime: reqToShow.scheduledDate ? `${reqToShow.scheduledDate}${reqToShow.scheduledTimeSlot ? ' (' + reqToShow.scheduledTimeSlot + ')' : ''}` : reqToShow.scheduledTime ? new Date(reqToShow.scheduledTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'As soon as possible',
              earnings: reqToShow.payout || 150
            });
          }
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Polling measurement requests error:', err);
        }
      }
    };
    pollForRequests();
    const interval = setInterval(pollForRequests, 15000);
    return () => clearInterval(interval);
  }, [request, isAccepting]);
  const handleAccept = async () => {
    const reqId = request?._id || request?.requestId;
    if (!reqId || isAccepting) return;
    setIsAccepting(true);
    if (reqId) dismissedRequestsRef.current.add(reqId.toString());
    try {
      await acceptRequest(reqId);
      toast.success('Measurement Visit Accepted! 🚀', {
        style: {
          borderRadius: '1rem',
          background: '#843D9B',
          color: '#fff',
          fontWeight: '900',
          fontSize: '12px'
        }
      });
      stopAlertAudio();
      setRequest(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request no longer available');
      stopAlertAudio();
      setRequest(null);
    } finally {
      setIsAccepting(false);
      x.setValue(0);
    }
  };
  acceptRef.current = handleAccept;
  const handleReject = async () => {
    const reqId = request?._id || request?.requestId;
    if (!reqId) {
      setRequest(null);
      return;
    }
    if (reqId) dismissedRequestsRef.current.add(reqId.toString());
    try {
      await rejectRequest(reqId);
      toast.error('Measurement Request Declined.', {
        style: {
          borderRadius: '1rem',
          background: '#333',
          color: '#fff',
          fontWeight: '900',
          fontSize: '11px'
        }
      });
    } catch (error) {
      console.error('Reject error:', error);
    } finally {
      stopAlertAudio();
      setRequest(null);
    }
  };
  if (!request) return null;
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <Box className="absolute left-4 right-4" style={{ top: insets.top + 16 }}>
                <Box className="bg-slate-900 rounded-[2rem] border border-primary/30 shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Header */}
                    <Box className="bg-gradient-to-r from-purple-900/60 to-slate-900 px-6 py-4 flex justify-between items-center border-b border-white/10">
                        <Box className="flex items-center gap-3">
                            <Box className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                                <I icon={Ruler} size={20} />
                            </Box>
                            <Box>
                                <Txt className="text-sm font-black text-white tracking-widest uppercase mb-0.5 animate-pulse">
                                    New Dispatch Request
                                </Txt>
                                <Txt className="text-[10px] font-bold text-purple-300 tracking-widest leading-none">
                                    EST. EARNINGS: ₹{request.earnings || 150}.00
                                </Txt>
                            </Box>
                        </Box>
                        <Btn onPress={handleReject} className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-rose-500 transition-all cursor-pointer">
                            <I icon={X} size={16} />
                        </Btn>
                    </Box>

                    {/* Content Body */}
                    <Box className="p-6 space-y-4">
                        {/* Customer Visit Location Card */}
                        <Box className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                            <Box className="flex items-center justify-between">
                                <Box className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                    <I icon={User} size={12} /> Customer Measurement Visit
                                </Box>
                                {request.distance && <Box className="text-[10px] font-black text-purple-300 bg-purple-500/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <I icon={Navigation} size={10} /> {request.distance}
                                    </Box>}
                            </Box>

                            <Box>
                                <Txt className="text-sm font-black text-white leading-snug">
                                    {request.customerName}
                                </Txt>
                                <Box className="flex items-start gap-2 text-white/70 text-xs mt-1.5 leading-snug">
                                    <I icon={MapPin} size={14} className="text-purple-400 shrink-0 mt-0.5" />
                                    <Txt>{request.address}</Txt>
                                </Box>
                            </Box>

                            {request.customerPhone && <Box className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                    <Box className="flex items-center gap-2 text-purple-300 font-bold">
                                        <I icon={Phone} size={12} />
                                        <Txt>{request.customerPhone}</Txt>
                                    </Box>
                                    <Btn onPress={() => Linking.openURL(`tel:${request.customerPhone}`)} className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1 rounded-lg border border-primary/40 transition-colors">
                                        Call Customer
                                    </Btn>
                                </Box>}
                        </Box>

                        {/* Scheduled Time & Order Reference */}
                        <Box className="flex items-center justify-between text-xs text-white/60 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                            <Box className="flex items-center gap-1.5">
                                <I icon={Clock} size={13} className="text-purple-400" />
                                <Txt>Visit Time: <Txt className="text-white font-bold">{request.scheduledTime}</Txt></Txt>
                            </Box>
                            <Box>
                                Order: <Txt className="text-purple-300 font-bold">#{request.orderIdStr}</Txt>
                            </Box>
                        </Box>

                        {/* Distance Note */}
                        <Box className="flex items-center gap-2 text-white/60 px-1">
                            <I icon={MapPin} size={12} className="text-purple-400" />
                            <Txt className="text-[11px] font-bold tracking-wide italic">
                                {request.distance ? `${request.distance} away from your current location` : 'Nearby your current location'}
                            </Txt>
                        </Box>

                        {/* Swipe to Accept - Rapido Style */}
                        <Box className="relative h-16 bg-white/5 rounded-2xl border border-white/10 p-1.5 overflow-hidden" onLayout={e => {
            maxX.current = Math.min(260, Math.max(0, e.nativeEvent.layout.width - 66));
          }}>
                            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: textOpacity, alignItems: 'center', justifyContent: 'center' }]}>
                                <Box className="flex items-center gap-2">
                                    <Txt className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Swipe to Accept</Txt>
                                    <I icon={ArrowRight} size={12} className="text-white/40" />
                                </Box>
                            </Animated.View>

                            {/* Success State Overlay in Swipe */}
                            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: checkOpacity, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(168,85,247,0.2)' }]}>
                                <I icon={Check} size={24} className="text-purple-300" />
                            </Animated.View>

                            <Animated.View {...pan.panHandlers} style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 10, transform: [{ translateX: x }] }}>
                                {isAccepting ? <I icon={Package} className="text-primary" size={20} /> : <I icon={ArrowRight} size={24} className="text-primary" />}
                            </Animated.View>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </View>;
};
export default NewMeasurementRequestAlert;
