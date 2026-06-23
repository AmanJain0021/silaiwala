import React from 'react';
import useMeasurementStore from '../store/measurementExecutiveStore';
import { User, MapPin, Briefcase, Phone, Mail, Award } from 'lucide-react';

const Profile = () => {
    const { profile } = useMeasurementStore();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!profile) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Profile</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                            {user.name?.charAt(0)}
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500 capitalize flex items-center">
                                <Award className="h-4 w-4 mr-1 text-gray-400" />
                                {user.role?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                        profile.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {profile.verificationStatus}
                    </span>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Mail className="h-5 w-5 mr-2" /> Email
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Phone className="h-5 w-5 mr-2" /> Phone Number
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.phoneNumber}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <MapPin className="h-5 w-5 mr-2" /> Registered Address
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.address || 'Not provided'}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Briefcase className="h-5 w-5 mr-2" /> Service Radius
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.serviceRadius} km</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                <Award className="h-5 w-5 mr-2" /> Total Measurements
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.totalMeasurements}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default Profile;
