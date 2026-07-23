import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Calendar,
    Download,
    IndianRupee,
    Package,
    Store,
    ShoppingBag,
    Truck,
    Users,
    Scissors,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../utils/api';
import { getOfflineStatusLabel } from '../constants/offlineOrderStatus';

const RANGE_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'this_month', label: 'This month' },
    { value: 'last_30_days', label: 'Last 30 days' },
];

const downloadCsv = (filename, rows) => {
    if (!rows?.length) {
        toast.error('No rows to export');
        return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map((row) =>
            headers
                .map((h) => {
                    let cell = row[h] ?? '';
                    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                })
                .join(',')
        ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const StatCard = ({ label, value, hint, icon: Icon, accent }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-xl font-black mt-1 ${accent || 'text-gray-900'}`}>{value}</p>
                {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
            </div>
            {Icon && (
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon size={16} />
                </div>
            )}
        </div>
    </div>
);

const Section = ({ title, action, children }) => (
    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-gray-900 tracking-tight">{title}</h2>
            {action}
        </div>
        <div className="p-5">{children}</div>
    </section>
);

const AdminOfflineReports = () => {
    const [range, setRange] = useState('this_month');
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/offline-reports/summary', { params: { range } });
            setData(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load offline reports');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [range]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const offline = data?.comparison?.offline;
    const online = data?.comparison?.online;
    const maxDayRevenue = Math.max(
        1,
        ...(data?.trends?.offlineByDay || []).map((d) => d.revenue || 0)
    );

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Offline Reports</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Walk-in shop analytics — kept separate from online marketplace totals
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2">
                        <Calendar size={14} className="text-gray-400" />
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="text-xs font-bold text-gray-700 outline-none bg-transparent"
                        >
                            {RANGE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={fetchReport}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={28} />
                </div>
            )}

            {!isLoading && data && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Offline vs Online */}
                    <Section title="Offline vs Online (side-by-side)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                    <Store size={12} /> Offline shop
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Orders</p>
                                        <p className="text-lg font-black">{offline?.orders || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Revenue</p>
                                        <p className="text-lg font-black text-primary">
                                            ₹{(offline?.revenue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Collected</p>
                                        <p className="text-lg font-black">
                                            ₹{(offline?.collected || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Balance due</p>
                                        <p className="text-lg font-black text-amber-600">
                                            ₹{(offline?.pendingBalance || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                                    <ShoppingBag size={12} /> Online marketplace
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Orders</p>
                                        <p className="text-lg font-black">{online?.orders || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Revenue</p>
                                        <p className="text-lg font-black">
                                            ₹{(online?.revenue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    Not mixed into offline totals. Online GST stays in Finance reports.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            label="Cash / manual collected"
                            value={`₹${(data.cashCollection?.totalCollected || 0).toLocaleString()}`}
                            hint="From advancePaid on walk-in orders"
                            icon={IndianRupee}
                            accent="text-primary"
                        />
                        <StatCard
                            label="Completed in range"
                            value={data.analytics?.completedInRange?.count || 0}
                            hint={
                                data.analytics?.completedInRange?.avgTurnaroundHours != null
                                    ? `Avg ${data.analytics.completedInRange.avgTurnaroundHours}h turnaround`
                                    : 'Delivered / picked up'
                            }
                            icon={Package}
                        />
                        <StatCard
                            label="Awaiting handoff"
                            value={data.pendingFulfillment?.length || 0}
                            hint="Ready for pickup or delivery"
                            icon={Truck}
                            accent="text-indigo-700"
                        />
                        <StatCard
                            label="Active walk-in customers"
                            value={data.analytics?.activeOfflineCustomers || 0}
                            hint="Offline customer profiles"
                            icon={Users}
                        />
                    </div>

                    {/* Volume trend */}
                    <Section
                        title="Offline volume & revenue trend"
                        action={
                            <button
                                type="button"
                                onClick={() =>
                                    downloadCsv(
                                        `offline_trend_${range}.csv`,
                                        (data.trends?.offlineByDay || []).map((d) => ({
                                            date: d._id,
                                            orders: d.orders,
                                            revenue: d.revenue,
                                            collected: d.collected,
                                        }))
                                    )
                                }
                                className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1"
                            >
                                <Download size={12} /> CSV
                            </button>
                        }
                    >
                        {(data.trends?.offlineByDay || []).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-6">No offline orders in this range</p>
                        ) : (
                            <div className="space-y-2">
                                {data.trends.offlineByDay.map((d) => (
                                    <div key={d._id} className="flex items-center gap-3">
                                        <span className="w-24 text-[10px] font-bold text-gray-500 shrink-0">
                                            {d._id}
                                        </span>
                                        <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden relative">
                                            <div
                                                className="h-full bg-primary/80 rounded-lg"
                                                style={{
                                                    width: `${Math.max(4, ((d.revenue || 0) / maxDayRevenue) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-16 text-right text-[10px] font-black text-gray-700">
                                            {d.orders} ord
                                        </span>
                                        <span className="w-24 text-right text-[10px] font-black text-primary">
                                            ₹{(d.revenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Cash collection */}
                    <Section
                        title="Daily cash / manual collection"
                        action={
                            <button
                                type="button"
                                onClick={() =>
                                    downloadCsv(
                                        `offline_cash_${range}.csv`,
                                        (data.cashCollection?.byDay || []).map((d) => ({
                                            date: d._id,
                                            orders: d.orders,
                                            collected: d.collected,
                                            orderValue: d.orderValue,
                                            balanceDue: d.balanceDue,
                                        }))
                                    )
                                }
                                className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1"
                            >
                                <Download size={12} /> CSV
                            </button>
                        }
                    >
                        <p className="text-[10px] text-gray-400 mb-3">{data.cashCollection?.note}</p>
                        {(data.cashCollection?.byDay || []).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No collections in range</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-50">
                                            <th className="py-2 pr-3">Date</th>
                                            <th className="py-2 pr-3">Orders</th>
                                            <th className="py-2 pr-3">Collected</th>
                                            <th className="py-2 pr-3">Order value</th>
                                            <th className="py-2">Balance due</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.cashCollection.byDay.map((d) => (
                                            <tr key={d._id}>
                                                <td className="py-2.5 pr-3 font-bold">{d._id}</td>
                                                <td className="py-2.5 pr-3">{d.orders}</td>
                                                <td className="py-2.5 pr-3 font-black text-primary">
                                                    ₹{(d.collected || 0).toLocaleString()}
                                                </td>
                                                <td className="py-2.5 pr-3">₹{(d.orderValue || 0).toLocaleString()}</td>
                                                <td className="py-2.5 text-amber-700 font-bold">
                                                    ₹{Math.max(0, d.balanceDue || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tailor productivity */}
                        <Section
                            title="Tailor productivity (shop orders)"
                            action={
                                <button
                                    type="button"
                                    onClick={() =>
                                        downloadCsv(
                                            `offline_tailors_${range}.csv`,
                                            (data.tailorProductivity || []).map((t) => ({
                                                name: t.name,
                                                phone: t.phone,
                                                orders: t.orders,
                                                delivered: t.delivered,
                                                revenue: t.revenue,
                                                avgTurnaroundHours: t.avgTurnaroundHours ?? '',
                                            }))
                                        )
                                    }
                                    className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1"
                                >
                                    <Download size={12} /> CSV
                                </button>
                            }
                        >
                            {(data.tailorProductivity || []).length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No assigned tailor work in range</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.tailorProductivity.map((t) => (
                                        <div
                                            key={t.tailorId}
                                            className="flex items-center justify-between gap-3 border border-gray-50 rounded-xl p-3"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Scissors size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-gray-900 truncate">{t.name}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {t.delivered}/{t.orders} delivered
                                                        {t.avgTurnaroundHours != null
                                                            ? ` · ${t.avgTurnaroundHours}h avg`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-black text-primary shrink-0">
                                                ₹{(t.revenue || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Popular garments / packages */}
                        <Section title="Popular garments & packages">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                        By garment
                                    </p>
                                    {(data.analytics?.byGarmentType || []).length === 0 ? (
                                        <p className="text-xs text-gray-400">No data</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {data.analytics.byGarmentType.map((g) => (
                                                <div key={g.garmentType} className="flex justify-between text-xs">
                                                    <span className="font-bold text-gray-700">{g.garmentType}</span>
                                                    <span className="text-gray-500">
                                                        {g.orders} · ₹{(g.revenue || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-gray-50 pt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                        By package
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(data.analytics?.byPackage || []).map((p) => (
                                            <span
                                                key={p.package}
                                                className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-wider"
                                            >
                                                {p.package || 'basic'} · {p.orders}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>

                    {/* Pending fulfillment */}
                    <Section
                        title="Pending pickups & deliveries"
                        action={
                            <Link
                                to="/admin/offline-orders"
                                className="text-[10px] font-black uppercase tracking-wider text-primary"
                            >
                                Open orders
                            </Link>
                        }
                    >
                        {(data.pendingFulfillment || []).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">Nothing awaiting handoff</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-50">
                                            <th className="py-2 pr-3">Order</th>
                                            <th className="py-2 pr-3">Customer</th>
                                            <th className="py-2 pr-3">Handoff</th>
                                            <th className="py-2 pr-3">Balance</th>
                                            <th className="py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.pendingFulfillment.map((o) => (
                                            <tr key={o._id}>
                                                <td className="py-2.5 pr-3">
                                                    <p className="font-black text-primary">{o.orderId}</p>
                                                    <p className="text-[10px] text-gray-400">{o.garmentType}</p>
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    <p className="font-bold">{o.customerName}</p>
                                                    <p className="text-[10px] text-gray-400">{o.customerPhone}</p>
                                                </td>
                                                <td className="py-2.5 pr-3 capitalize">
                                                    {o.fulfillmentMethod === 'home_delivery'
                                                        ? 'Home delivery'
                                                        : 'Pickup'}
                                                    {o.fulfillmentStatus === 'out_for_delivery' && (
                                                        <span className="block text-[9px] text-indigo-600 font-bold">
                                                            Out for delivery
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-3 font-bold text-amber-700">
                                                    ₹{(o.balanceDue || 0).toLocaleString()}
                                                </td>
                                                <td className="py-2.5">{getOfflineStatusLabel(o.status || 'ready')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Section>

                    {/* Top customers / history */}
                    <Section
                        title="Top walk-in customers"
                        action={
                            <Link
                                to="/admin/offline-customers"
                                className="text-[10px] font-black uppercase tracking-wider text-primary"
                            >
                                All customers
                            </Link>
                        }
                    >
                        {(data.analytics?.topCustomers || []).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No customers in range</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.analytics.topCustomers.map((c) => (
                                    <Link
                                        key={c._id}
                                        to={`/admin/offline-customers`}
                                        state={{ highlightId: c._id }}
                                        className="border border-gray-100 rounded-xl p-3 hover:border-primary/40 transition-colors"
                                    >
                                        <p className="text-xs font-black text-gray-900">{c.name || 'Customer'}</p>
                                        <p className="text-[10px] text-gray-400">{c.phone}</p>
                                        <p className="text-[10px] font-bold text-primary mt-2">
                                            {c.orders} orders · ₹{(c.spent || 0).toLocaleString()}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* GST note */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                        <BarChart3 className="text-amber-600 shrink-0" size={18} />
                        <div>
                            <p className="text-xs font-black text-amber-900">GST / Invoice report</p>
                            <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
                                {data.gst?.message ||
                                    'Offline orders do not store GST. Confirm if walk-in GST is required before building an invoice report.'}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AdminOfflineReports;
