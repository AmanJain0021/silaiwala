import React from 'react';
import { motion } from 'framer-motion';
import { User, Scissors, Truck } from 'lucide-react';
import { ROLES } from '../../../config/roles';

const roles = [
    {
        id: ROLES.CUSTOMER,
        title: 'Customer',
        icon: User,
        description: 'I want to get clothes stitched.',
        color: 'bg-indigo-50 text-primary border-indigo-200 hover:border-primary',
    },
    {
        id: ROLES.TAILOR,
        title: 'Tailor',
        icon: Scissors,
        description: 'I want to stitch clothes.',
        color: 'bg-indigo-50 text-primary border-indigo-200 hover:border-primary',
    },
    {
        id: ROLES.DELIVERY,
        title: 'Delivery Partner',
        icon: Truck,
        description: 'I want to deliver orders.',
        color: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-500',
    },
];

const RoleSelector = ({ selectedRole, onSelect }) => {
    return (
        <div className="grid grid-cols-1 gap-4 mb-6">
            {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                    <motion.div
                        key={role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(role.id)}
                        className={`
              cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4
              ${isSelected ? 'border-primary ring-1 ring-primary bg-indigo-50' : 'border-transparent bg-gray-50 hover:bg-white hover:shadow-md'}
            `}
                    >
                        <div className={`p-3 rounded-full ${role.color}`}>
                            <Icon size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{role.title}</h3>
                            <p className="text-sm text-gray-500">{role.description}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default RoleSelector;
