import React, { useState } from 'react';
import { Home, Briefcase, MapPin, MoreVertical, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../../utils/cn';
import useAddressStore from '../../../../../store/userStore';

const AddressCard = ({ address, isSelected, onSelect, onEdit }) => {
    const removeAddress = useAddressStore((state) => state.removeAddress);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const Icon = address.type === 'Work' ? Briefcase : Home;

    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative p-4 rounded-xl border transition-all cursor-pointer bg-white group hover:shadow-sm",
                isSelected ? "border-primary ring-1 ring-primary bg-indigo-50" : "border-gray-200 hover:border-gray-300"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                    )}>
                        <Icon size={14} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">{address.receiverName}</h4>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{address.type}</span>
                    </div>
                </div>

                {isSelected ? (
                    <div className="text-primary">
                        <CheckCircle2 size={20} fill="#843D9B" className="text-white" />
                    </div>
                ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-gray-400" />
                )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-3 pl-10">
                {address.street}<br />
                {address.city} - {address.zipCode}, {address.state}
            </p>

            <div className="text-xs font-medium text-gray-800 pl-10">
                Phone: {address.phone}
            </div>

            {/* Actions Menu */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit && onEdit();
                    }}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-primary rounded-full transition-colors shadow-sm"
                    title="Edit Address"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm('Are you sure you want to delete this address?')) {
                            removeAddress(address._id);
                        }
                    }}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors shadow-sm"
                    title="Delete Address"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default AddressCard;
