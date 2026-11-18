import { Bike as MdTwoWheeler } from 'lucide-react-native';
// Port of modules/delivery/pages/Tasks/Tasks.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import { pickImage } from '../lib/files';
import React, { useState, useEffect, useRef } from "react";
import { Package, Navigation, Phone, Camera, Image as ImageIcon, CheckCircle2, Check, Store, MapPin, AlertCircle, User, Loader2, Search, RefreshCw, X, Power, CreditCard } from "lucide-react-native";
import deliveryService from "../lib/deliveryService";
import toast from '../lib/toast';
import { useNavigate, useOutletContext } from '../lib/nav';
import useSocketStore from "../store/socketStore";
import useAuthStore from "../store/authStore";
import { getToken } from "../lib/auth";
import { pickPhotoFromInput, ensurePhotoDataUrl } from "../utils/pickDeliveryPhoto";
import { isPendingAcceptanceTask, isAcceptedActiveTask, getPartnerActionStage } from "../utils/taskStatus";
import { Txt, Btn, I, Box, Input, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const Tasks = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const {
    socket
  } = useSocketStore();
  const {
    isOnline,
    toggleAvailability
  } = useOutletContext() || {
    isOnline: true
  };
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' or 'available'
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [paymentSelection, setPaymentSelection] = useState(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([deliveryService.getAssignedOrders(null, true), deliveryService.getAvailableOrders(true), deliveryService.getAssignedOrders('completed', true)]);
      const [assignedResult, availableResult, completedResult] = results;
      if (assignedResult.status === 'fulfilled' && assignedResult.value?.success) {
        setTasks(assignedResult.value.data || []);
        setActiveTaskId(null);
      }
      if (availableResult.status === 'fulfilled' && availableResult.value?.success) {
        setAvailableTasks(availableResult.value.data || []);
      }
      if (completedResult.status === 'fulfilled' && completedResult.value?.success) {
        setCompletedTasks(completedResult.value.data || []);
      }
      const allRejected = results.every(r => r.status === 'rejected');
      if (allRejected) {
        const firstError = results[0]?.reason;
        const isCancel = firstError?.name === 'CanceledError' || firstError?.code === 'ERR_CANCELED' || firstError?.name === 'AbortError' || firstError?.message?.toLowerCase().includes('cancel');
        if (!isCancel && isOnline) {
          toast.error('Failed to load tasks');
        }
      }
      setLoading(false);
    } catch (error) {
      const isCancel = error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.name === 'AbortError' || error?.message?.toLowerCase().includes('cancel');
      if (!isCancel && isOnline) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks');
      }
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTasks();
    const handleNewTask = data => {
      console.log('New task received:', data);
      toast.success('New delivery task available!', {
        icon: '🚚',
        duration: 5000
      });
      fetchTasks(); // Refresh lists
    };
    const handleReceiveNewOrder = data => {
      console.log('Broadcasted pool order received:', data);
      fetchTasks(); // Refresh lists
    };
    const handleNewNotification = data => {
      if (data.type === 'TASK_ASSIGNED' || data.type === 'NEW_DELIVERY_TASK') {
        toast.success(data.message || 'New delivery task available!', {
          icon: '🚚',
          duration: 6000
        });
      } else {
        toast(data.message, {
          icon: '🔔'
        });
      }
      fetchTasks();
    };
    const handleTaskClaimed = data => {
      const currentUserId = useAuthStore.getState().user?._id || useAuthStore.getState().user?.id;
      const claimedId = data?.orderId?.toString?.() || data?.orderId;
      if (data.claimedBy === currentUserId) {
        // We claimed it! Just remove from available, keep in tasks
        setAvailableTasks(prev => prev.filter(t => t._id !== claimedId && t._id?.toString() !== claimedId));
      } else {
        console.log('Task claimed by another partner:', claimedId);
        setAvailableTasks(prev => prev.filter(t => t._id !== claimedId && t._id?.toString() !== claimedId));
        setTasks(prev => prev.filter(t => t._id !== claimedId && t._id?.toString() !== claimedId));
      }
    };
    if (socket) {
      socket.on('new_task', handleNewTask);
      socket.on('receive_new_order', handleReceiveNewOrder);
      socket.on('new_notification', handleNewNotification);
      socket.on('task_claimed', handleTaskClaimed);
    }
    return () => {
      if (socket) {
        socket.off('new_task', handleNewTask);
        socket.off('receive_new_order', handleReceiveNewOrder);
        socket.off('new_notification', handleNewNotification);
        socket.off('task_claimed', handleTaskClaimed);
      }
    };
  }, [socket]);
  const activeTask = tasks.find(t => t._id === activeTaskId && isAcceptedActiveTask(t, user));

  // Awaiting Accept / Reject — NOT active dispatch
  const pendingAcceptanceTasks = tasks.filter(t => isPendingAcceptanceTask(t, user));

  // Accepted but not yet in full-screen active execution view
  const pendingTasks = tasks.filter(t => {
    if (!isAcceptedActiveTask(t, user)) return false;
    if (activeTask && t._id === activeTask._id) return false;
    const isStatusValid = ['pending', 'accepted', 'ready', 'ready-for-pickup', 'fabric-ready-for-pickup', 'ready-for-delivery', 'out-for-delivery', 'fabric-picked-up'].includes(t.status);
    return isStatusValid;
  });
  const handleAcceptOrder = async orderId => {
    try {
      const res = await deliveryService.acceptOrder(orderId);
      if (res.success) {
        toast.success('Task claimed successfully!');
        await fetchTasks();
        setActiveTab('assigned');
        // After accept, show Start Dispatch — not full Active Dispatch yet
        setActiveTaskId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to claim task');
    }
  };
  const [taskProof, setTaskProof] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const handlePhotoSelect = (e, fromCamera) => {
    const input = e?.target;
    if (!input) return;
    try {
      pickPhotoFromInput(input, url => {
        setTaskProof(url);
        toast.success('Photo added');
      }, {
        fromCamera,
        onProcessing: setPhotoProcessing
      });
    } catch (err) {
      toast.error(err?.message || 'Could not process photo');
      if (input) input.value = '';
    }
  };
  const needsFinalPayment = task => {
    if (!task || task.taskType === 'fabric-pickup') return false;
    const due = Number(task.remainingPaymentAmount || 0);
    return due > 0 && task.remainingPaymentStatus !== 'paid';
  };
  const handleUpdateStatus = async (orderId, newStatus, message, proof = null, otp = null, paymentMethod = null) => {
    try {
      const isFinalComplete = newStatus === 'delivered';
      let res;
      if (isFinalComplete) {
        // Final T→C must go through /complete (payment + OTP enforced)
        await deliveryService.completeDelivery(orderId, {
          otp,
          deliveryProofPhoto: proof,
          paymentMethod: paymentMethod || undefined
        });
        res = {
          success: true
        };
      } else {
        res = await deliveryService.updateDeliveryStatus(orderId, newStatus, message, proof, otp, paymentMethod);
      }
      if (res.success || res) {
        toast.success(`Status updated to ${newStatus}`);
        if (newStatus === 'delivered' || newStatus === 'fabric-delivered' || newStatus === 'fabric-received') {
          setActiveTaskId(null);
          setTaskProof(null);
          setOtpInput('');
          setPaymentSelection(null);
        } else if (newStatus === 'out-for-delivery' || newStatus === 'fabric-picked-up') {
          setActiveTaskId(orderId);
        }
        if (newStatus === 'fabric-picked-up' || newStatus === 'picked-up-from-tailor' || newStatus === 'reached-dropoff') {
          setOtpInput('');
          setTaskProof(null);
        }
        fetchTasks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };
  const handleStartTask = async taskId => {
    if (activeTaskId) {
      toast.error('Finish the current Active Dispatch before starting another task.');
      return;
    }
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task || !isAcceptedActiveTask(task, user)) {
        toast.error('Accept the request first before starting dispatch.');
        return;
      }

      // Partner is already accepted — only mark task active in UI (no duplicate status API call)
      setActiveTaskId(taskId);
      toast.success('Dispatch started. Tap "Reached Pickup" when you arrive.');
      return;
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Failed to start dispatch. Please try again.');
    }
  };

  // Helper to format addresses
  const formatAddress = addr => {
    if (!addr) return 'Address not available';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      if (typeof addr.address === 'string' && addr.address) return addr.address;
      const parts = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
      if (addr.receiverName || addr.name) return `${addr.receiverName || addr.name}${addr.phone ? ' (' + addr.phone + ')' : ''}`;
    }
    return 'Address not available';
  };
  const getTaskType = task => {
    if (task.taskType === 'fabric-pickup') return 'Fabric Collection (C → T)';
    if (task.taskType === 'order-delivery') return 'Final Delivery (T → C)';
    return task.status.replace(/-/g, ' ').toUpperCase();
  };

  // Renders the bottom action area for the Active Task based on its current type and status
  const renderActiveTaskActions = task => {
    const btnClass = "w-full rounded-xl py-3 font-black tracking-[0.12em] text-[10px] uppercase flex items-center justify-center gap-2 transition-all shadow-md active:scale-95";
    const isFabric = task.taskType === 'fabric-pickup';

    // Use partner-phase status only — never treat order.status as "accepted" before accept
    const currentStage = getPartnerActionStage(task, user);
    if (!currentStage || currentStage === 'pending') {
      return <Txt className="text-center text-xs font-bold text-amber-600">
                    Accept this request first to start dispatch.
                </Txt>;
    }
    let actionUI = null;
    if (currentStage === 'accepted') {
      actionUI = <Btn onPress={() => handleUpdateStatus(task._id, 'reached-pickup')} className={`${btnClass} bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 uppercase tracking-widest font-black`}>
                    <I icon={MapPin} size={14} /> Reached Pickup Location
                </Btn>;
    } else if (currentStage === 'reached-pickup') {
      actionUI = <Box className="space-y-3">
                    <Input placeholder="Enter 6-digit OTP" value={otpInput} onChangeText={e => setOtpInput(e)} className="w-full text-center tracking-[0.5em] font-black py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 outline-none" maxLength={6} />
                    <Btn onPress={() => {
          if (!otpInput || otpInput.length < 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
          }
          handleUpdateStatus(task._id, isFabric ? 'fabric-picked-up' : 'picked-up-from-tailor', 'Picked up successfully', null, otpInput);
        }} className={`${btnClass} bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100 uppercase tracking-widest font-black`}>
                        <I icon={Package} size={14} /> Confirm Item Picked Up
                    </Btn>
                </Box>;
    } else if (currentStage === 'fabric-picked-up' || currentStage === 'picked-up' || currentStage === 'out-for-delivery') {
      actionUI = <Btn onPress={() => handleUpdateStatus(task._id, 'reached-dropoff')} className={`${btnClass} bg-slate-900 text-white hover:bg-black shadow-slate-100 uppercase tracking-widest font-black`}>
                    <I icon={Store} size={14} /> Reached Drop-off Location
                </Btn>;
    } else if (currentStage === 'reached-dropoff') {
      const duePayment = needsFinalPayment(task) || ['cod', 'cash'].includes(String(task.paymentMethod || '').toLowerCase()) && task.paymentStatus !== 'paid' && task.remainingPaymentStatus !== 'paid';
      const amountDue = Number(task.remainingPaymentAmount || task.totalAmount || task.total || 0);
      actionUI = <Box className="space-y-3">
                    <Input placeholder="Enter 6-digit OTP" value={otpInput} onChangeText={e => setOtpInput(e.replace(/\D/g, ''))} className="w-full text-center tracking-[0.5em] font-black py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none" maxLength={6} />
                    {!taskProof ? <Box className="grid grid-cols-2 gap-2">
                            <Btn onPress={() => pickImage({ camera: true }).then(f => f && handlePhotoSelect({ target: { files: [f] } }, true))} className={`${btnClass} bg-slate-100 text-slate-900 border border-slate-200 hover:bg-white`}>
                                <I icon={Camera} size={14} /> Camera
                            </Btn>
                            <Btn onPress={() => pickImage().then(f => f && handlePhotoSelect({ target: { files: [f] } }, false))} className={`${btnClass} bg-slate-100 text-slate-900 border border-slate-200 hover:bg-white`}>
                                <I icon={ImageIcon} size={14} /> Gallery
                            </Btn>
                        </Box> : <Box className="h-20 w-full rounded-xl overflow-hidden border-2 border-slate-800 relative">
                            <Img src={taskProof} alt="Proof" className="w-full h-full object-cover" />
                            {photoProcessing && <Box className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Spin className="w-6 h-6 text-white animate-spin" />
                                </Box>}
                            <Btn disabled={photoProcessing} onPress={() => setTaskProof(null)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-rose-500">
                                <I icon={X} size={12} />
                            </Btn>
                        </Box>}

                    {duePayment && <Box className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                            <Box className="flex items-center justify-between">
                                <Txt className="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1">
                                    <I icon={CreditCard} size={12} /> Collect payment
                                </Txt>
                                <Txt className="text-sm font-black text-slate-900">₹{amountDue}</Txt>
                            </Box>
                            <Box className="grid grid-cols-2 gap-2">
                                <Btn onPress={() => setPaymentSelection('cash')} className={`${btnClass} ${paymentSelection === 'cash' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                    Cash
                                </Btn>
                                <Btn onPress={() => setPaymentSelection('qr')} className={`${btnClass} ${paymentSelection === 'qr' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                    UPI QR
                                </Btn>
                            </Box>
                        </Box>}

                    <Btn onPress={async () => {
          if (!otpInput || otpInput.length < 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
          }
          if (!taskProof) {
            toast.error('Please take a delivery photo first');
            return;
          }
          if (photoProcessing) {
            toast.error('Photo still processing — wait a moment');
            return;
          }
          if (duePayment && !paymentSelection) {
            toast.error('Collect final payment (Cash or UPI) before completing');
            return;
          }
          const proof = await ensurePhotoDataUrl(taskProof);
          if (!proof) {
            toast.error('Photo still processing — wait a moment');
            return;
          }
          handleUpdateStatus(task._id, isFabric ? 'fabric-delivered' : 'delivered', 'Order successfully delivered', proof, otpInput, duePayment ? paymentSelection : null);
        }} className={`${btnClass} bg-primary text-white hover:bg-slate-900 shadow-indigo-100`}>
                        <I icon={CheckCircle2} size={14} /> Complete Delivery
                    </Btn>
                </Box>;
    }
    return <Box>
                {actionUI}
            </Box>;
  };
  if (loading) {
    return <Box className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Spin className="w-10 h-10 text-primary animate-spin" />
                <Txt className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Scanning Dispatches...</Txt>
            </Box>;
  }
  return <Box className="space-y-2 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 -mt-2">
            {/* Page Header */}
            <Box className="flex items-center justify-between px-1">
                <Box>
                    <Txt className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                        {activeTask ? 'Active Dispatch' : 'My Orders'}
                    </Txt>
                </Box>
                {!activeTask && <Btn onPress={fetchTasks} className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-primary transition-all active:rotate-180 duration-500">
                        <I icon={RefreshCw} size={16} />
                    </Btn>}
            </Box>

            {/* Online/Offline Block */}
            {!isOnline && <Box className="bg-white p-6 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-center space-y-3 shadow-sm animate-in fade-in zoom-in duration-500 mx-1">
                    <Box className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mx-auto">
                        <I icon={Power} size={24} className="opacity-50" />
                    </Box>
                    <Box className="space-y-1">
                        <Txt className="text-base font-black text-slate-900 tracking-tight">Currently Offline</Txt>
                        <Txt className="text-slate-500 text-[10px] font-medium tracking-wide leading-relaxed">You must be online to receive new 
 delivery requests and manage your tasks.</Txt>
                    </Box>
                    <Box className="flex flex-col gap-2 pt-1 max-w-xs mx-auto">
                        <Btn onPress={toggleAvailability} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer">
                            <I icon={Power} size={14} className="text-emerald-200" />
                            Go Online Now
                        </Btn>
                        <Btn onPress={() => navigate('/delivery/profile')} className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest py-1 transition-colors cursor-pointer">
                            Open Profile Settings
                        </Btn>
                    </Box>
                </Box>}

            {isOnline && <>
                {/* Tab Switcher */}
                {!activeTask && <Box className="flex p-1 bg-slate-100 rounded-xl gap-1 mx-1">
                        <Btn onPress={() => setActiveTab('assigned')} className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'assigned' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            My Tasks ({pendingAcceptanceTasks.length + pendingTasks.length})
                            {pendingAcceptanceTasks.length > 0 && <Txt className="ml-1 bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                    {pendingAcceptanceTasks.length} New!
                                </Txt>}
                        </Btn>
                        <Btn onPress={() => setActiveTab('available')} className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            Find New ({availableTasks.length})
                        </Btn>
                        <Btn onPress={() => setActiveTab('completed')} className={`flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            Completed ({completedTasks.length})
                        </Btn>
                    </Box>}

                <React.Fragment>
                    {/* ACTIVE TASK VIEW */}
                    {activeTask && <Box key="active-task-view" className="bg-white rounded-[1.25rem] border border-slate-100 shadow-md overflow-hidden relative mx-1">
                        <Box className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[80px] -z-0"></Box>
                        <Box className="p-4 relative z-10 space-y-3">

                            {/* Header Info */}
                            <Box className="flex justify-between items-start">
                                <Box className="space-y-0.5">
                                    <Box className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${activeTask.taskType === 'fabric-pickup' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-primary'}`}>
                                        <Box className="w-1 h-1 rounded-full bg-current animate-pulse"></Box>
                                        {getTaskType(activeTask)}
                                    </Box>
                                    <Txt className="text-base font-black text-slate-900 tracking-tight capitalize">Task #{activeTask._id.slice(-6)}</Txt>
                                </Box>
                                <Box className="text-right">
                                    <Txt className="text-[8px] font-bold text-slate-400 capitalize tracking-wider leading-none">Status</Txt>
                                    <Txt className="text-[11px] font-black text-primary-dark tracking-tight mt-0.5 capitalize leading-none">{activeTask.status}</Txt>
                                </Box>
                            </Box>

                            {/* Address details */}
                            <Box className="bg-slate-50 p-3 rounded-xl space-y-2.5 border border-slate-100">
                                {(() => {
                const isFabricPickup = activeTask.taskType === 'fabric-pickup';

                // Robust logic for determining stage:
                const pickupStatuses = ['pending', 'accepted', 'fabric-ready-for-pickup', 'ready-for-pickup', 'ready-for-delivery', 'reached-pickup'];
                const isPickupStage = pickupStatuses.includes(activeTask.status);
                const stopLabel = isPickupStage ? "Pickup Location" : "Drop-off Location";
                let address = 'Address not specified';
                let contactName = 'Unknown';
                let contactPhone = '';

                // Robust contact and phone resolution:
                const custName = typeof activeTask.customer === 'string' ? activeTask.customer : activeTask.customer?.name || activeTask.customerName || activeTask.deliveryAddress?.name || activeTask.shippingAddress?.name || 'Customer';
                const custPhone = activeTask.phone || activeTask.customerPhone || (typeof activeTask.customer === 'object' ? activeTask.customer?.phoneNumber || activeTask.customer?.phone : '') || activeTask.deliveryAddress?.phone || activeTask.deliveryAddress?.mobile || activeTask.shippingAddress?.phone || activeTask.shippingAddress?.mobile || '';
                const tailorName = activeTask.vendorName || activeTask.tailor?.shopName || (typeof activeTask.tailor === 'string' ? activeTask.tailor : 'Tailor Workshop');
                const tailorPhone = activeTask.vendorPhone || activeTask.tailorPhone || activeTask.tailor?.phoneNumber || activeTask.tailor?.phone || '';
                if (isFabricPickup) {
                  // Fabric Pickup Flow: Customer -> Tailor
                  if (isPickupStage) {
                    address = activeTask.deliveryAddress || activeTask.address || activeTask.shippingAddress;
                    contactName = custName;
                    contactPhone = custPhone;
                  } else {
                    address = activeTask.vendorAddress || activeTask.tailor?.location?.address || activeTask.tailor?.address;
                    contactName = tailorName;
                    contactPhone = tailorPhone;
                  }
                } else {
                  // Final Delivery Flow: Tailor -> Customer
                  if (isPickupStage) {
                    address = activeTask.vendorAddress || activeTask.tailor?.location?.address || activeTask.tailor?.address;
                    contactName = tailorName;
                    contactPhone = tailorPhone;
                  } else {
                    address = activeTask.deliveryAddress || activeTask.address || activeTask.shippingAddress;
                    contactName = custName;
                    contactPhone = custPhone;
                  }
                }
                return <>
                                            <Box className="flex gap-2.5">
                                                <Box className="w-6 h-6 rounded-full bg-slate-100 text-primary-dark flex items-center justify-center shrink-0">
                                                    <I icon={MapPin} size={12} />
                                                </Box>
                                                <Box>
                                                    <Txt className="text-[8px] font-bold text-slate-400 capitalize tracking-wider leading-none mb-0.5">{stopLabel}</Txt>
                                                    <Txt className="text-[12px] font-bold text-slate-700 leading-tight capitalize">{formatAddress(address)}</Txt>
                                                </Box>
                                            </Box>
                                            <Box className="flex gap-2 items-center pt-2 border-t border-slate-200/60 mt-0.5">
                                                <Box className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                                    <I icon={User} size={12} className="text-slate-400" />
                                                </Box>
                                                <Box className="flex-1 min-w-0">
                                                    <Box className="flex items-center gap-1.5 mb-0.5">
                                                        <Txt className="text-[11px] font-black text-slate-800 capitalize leading-none truncate">{contactName || 'Contact'}</Txt>
                                                        <Txt className="text-[6px] font-black bg-slate-100 text-primary-dark px-1 py-0.5 rounded uppercase tracking-tighter">Verified</Txt>
                                                    </Box>
                                                    <Txt className="text-[9px] font-bold text-slate-400 tracking-wide leading-none">{contactPhone || 'No Phone'}</Txt>
                                                </Box>
                                                <Btn onPress={() => Linking.openURL(`tel:${contactPhone}`)} className="w-7 h-7 bg-slate-50 text-primary-dark rounded-lg flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all shadow-sm">
                                                    <I icon={Phone} size={11} />
                                                </Btn>
                                            </Box>
                                        </>;
              })()}
                            </Box>

                            {/* Execution Area */}
                            <Box className="pt-0">
                                <Box className="flex items-center gap-2 mb-2">
                                    <Box className="h-px w-4 bg-slate-200"></Box>
                                    <Txt className="text-[8px] font-bold text-slate-400 capitalize tracking-wider">Execute Action</Txt>
                                    <Box className="h-px flex-1 bg-slate-200"></Box>
                                </Box>
                                {renderActiveTaskActions(activeTask)}
                            </Box>

                        </Box>
                        </Box>}

                    {/* TAB CONTENT */}
                    {!activeTask && <Box key={activeTab} className="space-y-3 px-1">
                            {activeTab === 'assigned' && <>
                                    {/* Tasks awaiting acceptance (partner was notified, needs to Accept/Reject) */}
                                    {pendingAcceptanceTasks.map(task => <Box key={task._id} className="bg-white p-4 rounded-[1.25rem] border-2 border-primary/30 shadow-lg relative overflow-hidden animate-pulse-border">
                                            {/* Pulsing notification dot */}
                                            <Box className="absolute top-3 right-3 flex items-center gap-1.5">
                                                <Box className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute" />
                                                <Box className="w-2 h-2 bg-green-500 rounded-full relative" />
                                                <Txt className="text-[8px] font-black text-green-700 uppercase tracking-widest ml-2">New Request!</Txt>
                                            </Box>

                                            <Box className="mb-3 mt-1">
                                                <Box className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest mb-1 ${task.taskType === 'fabric-pickup' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-primary'}`}>
                                                    {task.taskType === 'fabric-pickup' ? '📦 Fabric Collection' : '🛵 Final Delivery'}
                                                </Box>
                                                <Txt className="text-sm font-black text-slate-900 tracking-tight">New Delivery Task</Txt>
                                                <Txt className="text-[9px] font-bold text-slate-400 mt-0.5">Order #{task.orderId} • Please accept or reject</Txt>
                                            </Box>

                                            <Box className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 mb-3">
                                                <Box className="flex gap-2">
                                                    <I icon={MapPin} size={12} className="text-primary-dark mt-0.5 shrink-0" />
                                                    <Box>
                                                        <Txt className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup</Txt>
                                                        <Txt className="text-[11px] font-bold text-primary-dark leading-tight">
                                                            {task.taskType === 'fabric-pickup' ? formatAddress(task.deliveryAddress) : task.tailor?.shopName || 'Tailor Workshop'}
                                                        </Txt>
                                                    </Box>
                                                </Box>
                                                <Box className="flex gap-2 pt-2 border-t border-slate-200/50">
                                                    <I icon={Navigation} size={12} className="text-green-600 mt-0.5 shrink-0" />
                                                    <Box>
                                                        <Txt className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Drop-off</Txt>
                                                        <Txt className="text-[11px] font-bold text-slate-600 leading-tight">
                                                            {task.taskType === 'fabric-pickup' ? task.tailor?.shopName || 'Tailor Workshop' : formatAddress(task.deliveryAddress)}
                                                        </Txt>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box className="grid grid-cols-2 gap-2">
                                                <Btn onPress={async () => {
                  try {
                    await deliveryService.rejectOrder(task._id);
                    toast.success('Task rejected');
                    fetchTasks();
                  } catch (e) {
                    toast.error('Failed to reject task');
                  }
                }} className="py-2.5 bg-slate-100 text-slate-700 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all">
                                                    <I icon={X} size={12} /> Reject
                                                </Btn>
                                                <Btn onPress={() => handleAcceptOrder(task._id)} className="py-2.5 bg-primary text-white rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-95 transition-all">
                                                    <I icon={Check} size={12} /> Accept
                                                </Btn>
                                            </Box>
                                        </Box>)}

                                    {/* Already accepted tasks (just waiting to start) */}
                                    {pendingTasks.map(task => <Box key={task._id} className="bg-white p-4 rounded-[1.25rem] border-2 border-slate-100 shadow-sm transition-all hover:border-slate-100">
                                            <Box className="flex justify-between items-start mb-3">
                                                <Box className="space-y-0.5">
                                                    <Box className="flex items-center gap-2">
                                                        <Txt className="text-sm font-black text-slate-800 tracking-tight capitalize">{getTaskType(task)}</Txt>
                                                        <Txt className="text-[9px] font-black text-primary bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter italic">#{task._id.slice(-6)}</Txt>
                                                    </Box>
                                                    <Txt className="text-[9px] font-bold text-slate-500 capitalize tracking-wide">
                                                        {task.taskType === 'fabric-pickup' ? `From: ${task.customer?.name}` : `From: ${task.tailor?.shopName}`}
                                                    </Txt>
                                                </Box>
                                                <Txt className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                                                    Accepted
                                                </Txt>
                                            </Box>

                                            <Box className="space-y-2.5 mb-4 pl-0.5">
                                                <Box className="flex gap-2.5">
                                                    <Box className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-primary-dark">
                                                        <I icon={MapPin} size={12} />
                                                    </Box>
                                                    <Box className="flex-1">
                                                        <Txt className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</Txt>
                                                        <Txt className="text-[11px] font-bold text-primary-dark leading-tight capitalize">
                                                            {task.taskType === 'fabric-pickup' ? formatAddress(task.deliveryAddress) : formatAddress(task.tailor?.location?.address || task.tailor?.address)}
                                                        </Txt>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Btn onPress={() => navigate(`/delivery/orders/${task._id}`)} className="w-full bg-slate-900 text-white rounded-lg py-3 font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary-dark active:scale-95 transition-all shadow-md">
                                                View Dispatch Details <I icon={Navigation} size={12} />
                                            </Btn>
                                        </Box>)}

                                    {pendingAcceptanceTasks.length === 0 && pendingTasks.length === 0 && <Box className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <Box className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <I icon={CheckCircle2} size={24} />
                                            </Box>
                                            <Txt className="text-slate-500 font-bold capitalize tracking-wide text-sm">No pending tasks assigned.</Txt>
                                            <Txt className="text-slate-400 text-[9px] mt-0.5">Check "Find New" for available dispatches.</Txt>
                                        </Box>}
                                </>}
                            {activeTab === 'available' && <>
                                    {availableTasks.map(task => <Box key={task._id} className="bg-white p-4 rounded-[1.5rem] border-2 border-slate-100 shadow-lg relative overflow-hidden group">
                                             <Box className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -z-0 group-hover:bg-indigo-100 transition-all"></Box>
                                            
                                            <Box className="relative z-10 space-y-3">
                                                <Box className="flex justify-between items-start">
                                                     <Box className="space-y-0.5">
                                                        <Box className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest mb-0.5 ${task.taskType === 'fabric-pickup' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-primary'}`}>
                                                            {task.taskType === 'fabric-pickup' ? 'Fabric Collection' : 'Final Delivery'}
                                                        </Box>
                                                        <Txt className="text-sm font-black text-slate-900 tracking-tight capitalize">Available Dispatch</Txt>
                                                        <Txt className="text-[10px] font-bold text-slate-400 tracking-wide italic leading-none mt-0.5">Reward: ₹{task.deliveryEarnings || task.deliveryFee || 20}</Txt>
                                                    </Box>
                                                    <Box className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${task.taskType === 'fabric-pickup' ? 'bg-amber-600' : 'bg-primary'}`}>
                                                        <I icon={MdTwoWheeler} size={18} />
                                                    </Box>
                                                </Box>

                                                 <Box className="bg-slate-50 p-3 rounded-xl space-y-2.5 border border-slate-100">
                                                    <Box className="space-y-1.5">
                                                        <Box className="flex items-center gap-1.5">
                                                            <Box className="w-1 h-1 rounded-full bg-primary"></Box>
                                                            <Txt className="text-[7px] font-black uppercase tracking-widest text-slate-400">Pickup</Txt>
                                                        </Box>
                                                        <Box className="flex gap-2 pl-2">
                                                            <I icon={MapPin} size={11} className="text-primary-dark mt-0.5 shrink-0" />
                                                            <Txt className="text-[10px] font-bold text-primary-dark leading-snug">
                                                                 {task.taskType === 'fabric-pickup' ? formatAddress(task.address || task.deliveryAddress) : task.tailor?.shopName || 'Tailor Workshop'}
                                                            </Txt>
                                                        </Box>
                                                    </Box>
                                                    <Box className="space-y-1.5 pt-2 border-t border-slate-200/50">
                                                        <Box className="flex items-center gap-1.5">
                                                            <Box className="w-1 h-1 rounded-full bg-slate-400"></Box>
                                                            <Txt className="text-[7px] font-black uppercase tracking-widest text-slate-400">Drop-off</Txt>
                                                        </Box>
                                                        <Box className="flex gap-2 pl-2">
                                                            <I icon={Store} size={11} className="text-primary-dark mt-0.5 shrink-0" />
                                                            <Txt className="text-[10px] font-bold text-primary-dark leading-snug opacity-80">
                                                                {task.taskType === 'fabric-pickup' ? task.tailor?.shopName || 'Tailor Workshop' : formatAddress(task.address || task.deliveryAddress)}
                                                            </Txt>
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                <Btn onPress={() => handleAcceptOrder(task._id)} className="w-full bg-slate-900 text-white rounded-xl py-3 font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
                                                    Accept Order <I icon={Check} size={14} />
                                                </Btn>
                                            </Box>
                                        </Box>)}

                                    {availableTasks.length === 0 && <Box className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <Box className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <I icon={Search} size={24} />
                                            </Box>
                                            <Txt className="text-slate-500 font-bold capitalize tracking-wide text-sm">Searching for dispatches...</Txt>
                                            <Txt className="text-slate-400 text-[9px] mt-0.5">Try again in a few minutes.</Txt>
                                        </Box>}
                                </>}
                            {activeTab === 'completed' && <>
                                    {completedTasks.map(task => <Box key={task._id} className="bg-white p-4 rounded-[1.25rem] border-2 border-slate-100 shadow-sm transition-all mb-3">
                                            <Box className="flex justify-between items-start mb-3">
                                                <Box className="space-y-0.5">
                                                    <Box className="flex items-center gap-2">
                                                        <Txt className="text-sm font-black text-slate-800 tracking-tight capitalize">{getTaskType(task)}</Txt>
                                                        <Txt className="text-[9px] font-black text-primary bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter italic">#{task._id.slice(-6)}</Txt>
                                                    </Box>
                                                    <Txt className="text-[9px] font-bold text-slate-500 capitalize tracking-wide">
                                                        {task.taskType === 'fabric-pickup' ? `From: ${task.customer?.name}` : `From: ${task.tailor?.shopName}`}
                                                    </Txt>
                                                </Box>
                                                <Txt className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                                                    {task.status.replace(/-/g, ' ')}
                                                </Txt>
                                            </Box>

                                            <Box className="space-y-2.5 pl-0.5">
                                                <Box className="flex gap-2.5">
                                                    <Box className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                                        <I icon={CheckCircle2} size={12} />
                                                    </Box>
                                                    <Box className="flex-1">
                                                        <Txt className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Delivered To</Txt>
                                                        <Txt className="text-[11px] font-bold text-slate-600 leading-tight capitalize">
                                                            {task.taskType === 'fabric-pickup' ? formatAddress(task.tailor?.location?.address || task.tailor?.address) : formatAddress(task.deliveryAddress)}
                                                        </Txt>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>)}

                                    {completedTasks.length === 0 && <Box className="text-center py-16 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                                            <Box className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                                <I icon={CheckCircle2} size={24} />
                                            </Box>
                                            <Txt className="text-slate-500 font-bold capitalize tracking-wide text-sm">No completed tasks.</Txt>
                                            <Txt className="text-slate-400 text-[9px] mt-0.5">Your delivered orders will appear here.</Txt>
                                        </Box>}
                                </>}
                        </Box>}
                </React.Fragment>
                </>}
        </Box>;
};
export default Tasks;
