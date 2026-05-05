import React from 'react';

const StatusBadge = ({ status }) => {
    const styles = {
        APPROVED: 'bg-green-50 text-green-700 border-green-100',
        PENDING_APPROVAL: 'bg-indigo-50 text-blue-700 border-indigo-100',
        REJECTED: 'bg-red-50 text-red-700 border-red-100',
        SUSPENDED: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    const labels = {
        APPROVED: 'Approved',
        PENDING_APPROVAL: 'Under Review',
        REJECTED: 'Rejected',
        SUSPENDED: 'Suspended',
    };

    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-current ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export default StatusBadge;
