import React, { createContext, useContext, useEffect, useState } from 'react';
import useMeasurementStore from '../store/measurementExecutiveStore';
import socket from '../../../shared/utils/socket';
import { playNotificationSound } from '../../../utils/audio';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MeasurementAuthContext = createContext();

export const MeasurementAuthProvider = ({ children }) => {
    const { profile, fetchDashboard } = useMeasurementStore();
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'measurement_executive') {
                fetchDashboard();
                const userId = user._id || user.id;
                setupSocket(userId);
            }
        }

        return () => {
            if (socket) {
                socket.off('new_measurement_request');
                socket.off('measurement_request_accepted');
            }
        };
    }, []);

    const setupSocket = (userId) => {
        if (!socket.connected) {
            socket.connect();
        }

        // Join global user room
        socket.emit('join_user_room', userId);
        
        // Join specific executive room
        socket.emit('join_measurement_executive_room');
        setIsSocketConnected(true);

        socket.on('new_measurement_request', (data) => {
            playNotificationSound('delivery');
            toast.success('New Measurement Request Assigned! 📐', { duration: 6000 });
            // The request list page will automatically refresh if it's open, 
            // but we could also force a fetch here
        });

        socket.on('measurement_request_accepted', (data) => {
            // Notification if needed
        });
    };

    const value = {
        profile,
        isSocketConnected
    };

    return (
        <MeasurementAuthContext.Provider value={value}>
            {children}
        </MeasurementAuthContext.Provider>
    );
};

export const useMeasurementAuth = () => useContext(MeasurementAuthContext);
