import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, TrendingUp, Users, Package, ShoppingBag } from 'lucide-react';

const AdminReports = () => {
    const [selectedReportType, setSelectedReportType] = useState('Sales & Revenue');
    const [dateRange, setDateRange] = useState('This Month');

    const reportTypes = [
        { id: 'Sales & Revenue', icon: <TrendingUp size={18} />, desc: 'Detailed breakdown of platform earnings, commissions, and transaction volume.' },
        { id: 'Tailor Performance', icon: <Users size={18} />, desc: 'Metrics on tailor completion rates, ratings, and revenue generation.' },
        { id: 'Customer Insights', icon: <ShoppingBag size={18} />, desc: 'User acquisition, retention rates, and average order value analysis.' },
        { id: 'Delivery Metrics', icon: <Package size={18} />, desc: 'Delivery partner efficiency, average delivery times, and geographic coverage.' },
    ];

    const generateReport = () => {
        // Mock generation logic
        alert(`Generating ${selectedReportType} report for ${dateRange}...`);
    };

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Reports</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">Generate and export analytical data across all platform modules</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 h-max">
                    <h3 className="text-sm font-black text-gray-900 tracking-tight">Report Configuration</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Select Report Type</label>
                            <div className="space-y-2">
                                {reportTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedReportType(type.id)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${selectedReportType === type.id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${selectedReportType === type.id ? 'bg-primary text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                                            {type.icon}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold ${selectedReportType === type.id ? 'text-primary' : 'text-gray-900'}`}>{type.id}</p>
                                            <p className="text-[9px] font-medium opacity-80 mt-0.5 leading-snug">{type.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex items-center gap-1.5">
                                <Calendar size={12} /> Date Range
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option>Today</option>
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>This Year</option>
                                <option>Custom Range...</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex items-center gap-1.5">
                                <Filter size={12} /> Format
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 hover:bg-gray-100 transition-colors shadow-sm">
                                    CSV
                                </button>
                                <button className="py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary shadow-sm">
                                    PDF
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={generateReport}
                            className="w-full mt-4 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest flex justify-center items-center gap-2"
                        >
                            <Download size={16} /> Generate & Download
                        </button>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-inner p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#4ade80] opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
                    </div>

                    <FileText size={64} className="text-primary/20 mb-6" />
                    <h2 className="text-xl font-black text-gray-900 mb-2">Report Preview</h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Select a report type and date range on the left, then click generate to download your customized analytics report.
                    </p>

                    <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-primary rounded-lg">
                                {reportTypes.find(t => t.id === selectedReportType)?.icon}
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-sm font-bold text-gray-900">{selectedReportType} Report</p>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Calendar size={10} /> {dateRange}
                                </p>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase tracking-widest">.PDF</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
