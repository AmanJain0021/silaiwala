// Port of modules/measurement-executive/context/MeasurementAuthContext.jsx. Mounted once at the app root and
// driven by the session, so the socket follows login/logout and rejoins its rooms after every reconnect.
import React, { createContext, useContext, useEffect, useState } from 'react';
import useMeasurementStore from '../../store/measurementExecutiveStore';
import useAuthStore from '../../store/authStore';
import socket from '../../utils/socket';
import { playNotificationSound } from '../../utils/audio';
import toast from '../../lib/toast';
import NewMeasurementRequestAlert from './NewMeasurementRequestAlert';

const MeasurementAuthContext = createContext({ profile: null, isSocketConnected: false });

export const MeasurementAuthProvider = ({ children }) => {
  const profile = useMeasurementStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const userId = user?._id || user?.id;
  const isExecutive = isAuthenticated && user?.role === 'measurement_executive' && !!userId;
  const isApproved = isExecutive && user?.isActive !== false;

  useEffect(() => {
    if (!isApproved) return undefined;
    if (!useMeasurementStore.getState().profile) useMeasurementStore.getState().fetchDashboard();
    const io = socket.connect();
    const joinRooms = () => {
      io.emit('join_user_room', userId);
      io.emit('join_measurement_executive_room');
      setIsSocketConnected(true);
    };
    const onDisconnect = () => setIsSocketConnected(false);
    // The ringtone is started by NewMeasurementRequestAlert, which skips requests already dismissed.
    const onNewRequest = () => {
      playNotificationSound('delivery');
      toast.success('New Measurement Request Assigned! 📐', { duration: 6000 });
    };
    io.on('connect', joinRooms);
    io.on('disconnect', onDisconnect);
    io.on('new_measurement_request', onNewRequest);
    if (io.connected) joinRooms();
    return () => {
      io.off('connect', joinRooms);
      io.off('disconnect', onDisconnect);
      io.off('new_measurement_request', onNewRequest);
      socket.disconnect();
      setIsSocketConnected(false);
    };
  }, [isApproved, userId]);

  return (
    <MeasurementAuthContext.Provider value={{ profile, isSocketConnected }}>
      {children}
      {isApproved ? <NewMeasurementRequestAlert /> : null}
    </MeasurementAuthContext.Provider>
  );
};

export const useMeasurementAuth = () => useContext(MeasurementAuthContext);
