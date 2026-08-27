import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, UserCheck, UserPlus, RotateCcw, Crown, Target, DollarSign,
  MoveUpRight, MoveDownRight, Star, Link2, LifeBuoy, Target as TargetIcon,
  X, Settings, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const StatCard = ({ icon: Icon, title, value, trend, isPositive, subtitle, iconColor, iconBg }) => (
  <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-center">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <h4 className="text-gray-500 text-[11px] font-medium truncate">{title}</h4>
        <p className="text-[20px] font-bold text-gray-900 leading-tight truncate">{value}</p>
      </div>
    </div>
    <div className="flex items-center gap-1 text-[11px] font-medium whitespace-nowrap">
      <span className={`flex items-center gap-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <MoveUpRight size={12} strokeWidth={3} /> : <MoveDownRight size={12} strokeWidth={3} />}
        {trend}
      </span>
      <span className="text-gray-400">{subtitle}</span>
    </div>
  </div>
);

const CRM = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/admin/crm/dashboard');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          toast.error('Failed to load CRM data');
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

  const { summary, growth, segmentation, loyalty, recentCustomers, topCustomers, referrals, support, feedback, aiInsights } = data;

  const pieData = [
    { name: 'New Customers', value: segmentation.new },
    { name: 'Active Customers', value: segmentation.active },
    { name: 'Repeat Customers', value: segmentation.repeat },
    { name: 'VIP Customers', value: segmentation.vip },
    { name: 'Inactive Customers', value: segmentation.inactive }
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-[#f8f9fc] min-h-[calc(100vh-64px)] font-sans w-full max-w-full overflow-hidden">
      
      {/* Top Stats - Horizontally Scrollable on small screens to fit 7 columns exactly */}
      <div className="w-full overflow-x-auto no-scrollbar pb-2">
        <div className="grid grid-cols-7 gap-4 min-w-[1250px]">
          <StatCard 
            icon={Users} title="Total Customers" value={summary.totalCustomers.toLocaleString()} 
            trend="12.5%" isPositive={true} subtitle="from last week" 
            iconColor="text-[#6366f1]" iconBg="bg-[#eef2ff]"
          />
          <StatCard 
            icon={UserCheck} title="Active Customers" value={summary.activeCustomers.toLocaleString()} 
            trend="9.8%" isPositive={true} subtitle="from last week" 
            iconColor="text-[#10b981]" iconBg="bg-[#ecfdf5]"
          />
          <StatCard 
            icon={UserPlus} title="New Customers Today" value={summary.newCustomersToday.toLocaleString()} 
            trend="15.3%" isPositive={true} subtitle="from yesterday" 
            iconColor="text-[#f43f5e]" iconBg="bg-[#fff1f2]"
          />
          <StatCard 
            icon={RotateCcw} title="Repeat Customers" value={summary.repeatCustomers.toLocaleString()} 
            trend="11.7%" isPositive={true} subtitle="from last week" 
            iconColor="text-[#3b82f6]" iconBg="bg-[#eff6ff]"
          />
          <StatCard 
            icon={Crown} title="VIP Customers" value={summary.vipCustomers.toLocaleString()} 
            trend="8.2%" isPositive={true} subtitle="from last week" 
            iconColor="text-[#f59e0b]" iconBg="bg-[#fffbeb]"
          />
          <StatCard 
            icon={Target} title="Churn Rate" value={`${summary.churnRate}%`} 
            trend="0.8%" isPositive={false} subtitle="from last week" 
            iconColor="text-[#ef4444]" iconBg="bg-[#fef2f2]"
          />
          <StatCard 
            icon={DollarSign} title="Customer Lifetime Value (CLV)" value={`₹${summary.clv.toLocaleString()}`} 
            trend="10.4%" isPositive={true} subtitle="from last week" 
            iconColor="text-[#8b5cf6]" iconBg="bg-[#f5f3ff]"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Growth Area Chart (col-span-2) */}
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
               <h3 className="font-bold text-gray-900 text-sm mr-2">Customer Growth Overview</h3>
               <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#8b5cf6]"></span> New Customers</div>
               <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#4c1d95] border-t border-dashed"></span> Repeat Customers</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#c4b5fd]"></span> Total Customers</div>
            </div>
            <select className="bg-white border border-gray-200 text-gray-600 text-[11px] rounded focus:ring-primary focus:border-primary px-2 py-1 outline-none font-medium">
              <option>This Week</option>
            </select>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val} />
                <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                    labelStyle={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="totalCustomers" stroke="#c4b5fd" strokeWidth={2} fillOpacity={0} name="Total Customers" />
                <Area type="monotone" dataKey="newCustomers" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" name="New Customers" />
                <Area type="monotone" dataKey="repeatCustomers" stroke="#4c1d95" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Repeat Customers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart (col-span-1) */}
        <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col lg:col-span-1">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Customer Segmentation</h3>
          <div className="flex items-center flex-1">
              <div className="h-32 w-1/2 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="90%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', fontSize: '11px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-gray-900 leading-tight">{summary.totalCustomers.toLocaleString()}</span>
                  <span className="text-[8px] font-medium text-gray-500">Total Customers</span>
                </div>
              </div>
              <div className="w-1/2 pl-3 flex flex-col justify-center gap-1.5">
                  {pieData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[9px] xl:text-[10px]">
                          <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx] }}></div>
                              <span className="font-medium text-gray-600 truncate max-w-[50px] xl:max-w-[70px]">{item.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                             <span className="font-bold text-gray-900 mr-1">{item.value.toLocaleString()}</span>
                             <span className="text-gray-400">({((item.value/Math.max(summary.totalCustomers, 1))*100).toFixed(1)}%)</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>
        
        {/* Loyalty Program Overview (col-span-1) */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col lg:col-span-1 overflow-hidden">
            <div className="p-4 pb-2">
                <h3 className="font-bold text-gray-900 text-sm">Loyalty Program Overview</h3>
            </div>
            <div className="mx-4 bg-[#50249c] rounded-xl p-4 text-white relative overflow-hidden mb-3">
                <Crown size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                       <p className="text-purple-200 text-[10px] mb-0.5">Total Members</p>
                       <p className="text-xl font-bold">{loyalty.totalMembers.toLocaleString()}</p>
                   </div>
                   <Crown size={20} className="text-yellow-400" />
                </div>
                
                <div className="flex justify-between border-t border-purple-400/30 pt-3 relative z-10">
                    <div>
                        <p className="text-[9px] text-purple-200 mb-0.5">Points Issued</p>
                        <p className="font-bold text-xs">{loyalty.pointsIssued.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-purple-200 mb-0.5">Points Redeemed</p>
                        <p className="font-bold text-xs">{loyalty.pointsRedeemed.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <div className="px-4 pb-4 flex-1">
                <h4 className="text-[10px] font-bold text-gray-900 mb-2">Top Membership Tiers</h4>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                            <span className="text-blue-500 text-sm">💎</span> Diamond
                        </div>
                        <span className="font-bold text-gray-900">{loyalty.tiers.diamond.toLocaleString()} <span className="text-gray-400 font-medium ml-1">({((loyalty.tiers.diamond/Math.max(loyalty.totalMembers, 1))*100).toFixed(1)}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                            <span className="text-gray-400 text-sm">💿</span> Platinum
                        </div>
                        <span className="font-bold text-gray-900">{loyalty.tiers.platinum.toLocaleString()} <span className="text-gray-400 font-medium ml-1">({((loyalty.tiers.platinum/Math.max(loyalty.totalMembers, 1))*100).toFixed(1)}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                            <span className="text-yellow-500 text-sm">🏆</span> Gold
                        </div>
                        <span className="font-bold text-gray-900">{loyalty.tiers.gold.toLocaleString()} <span className="text-gray-400 font-medium ml-1">({((loyalty.tiers.gold/Math.max(loyalty.totalMembers, 1))*100).toFixed(1)}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                            <span className="text-gray-300 text-sm">🥈</span> Silver
                        </div>
                        <span className="font-bold text-gray-900">{loyalty.tiers.silver.toLocaleString()} <span className="text-gray-400 font-medium ml-1">({((loyalty.tiers.silver/Math.max(loyalty.totalMembers, 1))*100).toFixed(1)}%)</span></span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Row 3 - Tables & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recent Customers */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">Recent Customers</h3>
          </div>
          <div className="overflow-x-auto flex-1 p-4 pt-0">
            <table className="w-full text-left text-[11px]">
              <thead className="text-[10px] text-gray-500 font-medium border-b border-gray-50">
                <tr>
                  <th className="px-2 py-3">Customer ID</th>
                  <th className="px-2 py-3">Customer Name</th>
                  <th className="px-2 py-3">Mobile</th>
                  <th className="px-2 py-3">Location</th>
                  <th className="px-2 py-3 text-center">Total Orders</th>
                  <th className="px-2 py-3 text-right">Total Spend</th>
                  <th className="px-2 py-3 text-center">Last Order</th>
                  <th className="px-2 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentCustomers.map((cust, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-2 py-3 font-medium text-gray-500">{cust.displayId}</td>
                    <td className="px-2 py-3 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0 text-[9px]">
                            {cust.profileImage && cust.profileImage !== 'default_profile.png' ? <img src={cust.profileImage} alt="" className="w-full h-full object-cover" /> : cust.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900 whitespace-nowrap">{cust.name}</span>
                    </td>
                    <td className="px-2 py-3 text-gray-500">{cust.mobile}</td>
                    <td className="px-2 py-3 text-gray-500">{cust.location}</td>
                    <td className="px-2 py-3 text-center font-bold text-gray-700">{cust.totalOrders}</td>
                    <td className="px-2 py-3 font-bold text-gray-900 text-right">₹{cust.totalSpend.toLocaleString()}</td>
                    <td className="px-2 py-3 text-center text-gray-500">{cust.lastOrder ? new Date(cust.lastOrder).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}</td>
                    <td className="px-2 py-3 text-center">
                        <span className={`inline-flex font-bold tracking-wide ${cust.status === 'Active' ? 'text-green-500' : 'text-amber-500'}`}>
                            {cust.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers By Spend */}
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-sm">Top Customers (By Spend)</h3>
                <button onClick={() => navigate('/admin/customers')} className="text-[11px] text-indigo-600 font-bold hover:underline">View All</button>
            </div>
            <div className="flex flex-col gap-3 flex-1">
                {topCustomers.slice(0, 5).map((cust, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-orange-100 text-orange-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-orange-50 text-orange-400' : 'text-gray-400'}`}>
                            {i + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0 text-[11px]">
                            {cust.profileImage && cust.profileImage !== 'default_profile.png' ? <img src={cust.profileImage} alt="" className="w-full h-full object-cover" /> : cust.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate text-[11px]">{cust.name}</h4>
                            <p className="text-[10px] text-gray-400 truncate">{cust.location}</p>
                        </div>
                        <div className="font-bold text-gray-900 text-[12px]">
                            ₹{cust.totalSpend.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Bottom Row - 4 items (marketing removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Referral Overview */}
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#eef2ff] text-[#6366f1] rounded-lg">
                    <Link2 size={16} strokeWidth={2.5} />
                </div>
                <h4 className="font-bold text-gray-900 text-[12px]">Referral Overview</h4>
            </div>
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Total Referrals</span>
                    <span className="text-base font-bold text-gray-900 leading-none">{referrals.total.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Successful</span>
                    <span className="text-base font-bold text-gray-900 leading-none">{referrals.successful.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Referral Earnings</span>
                    <span className="text-base font-bold text-gray-900 leading-none">₹{referrals.earnings.toLocaleString()}</span>
                </div>
            </div>
            <div className="mt-auto text-center border-t border-gray-50 pt-2">
                <button onClick={() => setIsReferralModalOpen(true)} className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">View Details</button>
            </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fff1f2] text-[#f43f5e] rounded-lg">
                    <LifeBuoy size={16} strokeWidth={2.5} />
                </div>
                <h4 className="font-bold text-gray-900 text-[12px]">Support Tickets</h4>
            </div>
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Open Tickets</span>
                    <span className="text-base font-bold text-[#f43f5e] leading-none">{support.open}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Pending</span>
                    <span className="text-base font-bold text-[#f59e0b] leading-none">{support.pending}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Resolved</span>
                    <span className="text-base font-bold text-[#10b981] leading-none">{support.resolved}</span>
                </div>
            </div>
            <div className="mt-auto text-center border-t border-gray-50 pt-2">
                <button onClick={() => navigate('/admin/support')} className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">View Tickets</button>
            </div>
        </div>

        {/* Feedback & Reviews */}
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#f5f3ff] text-[#8b5cf6] rounded-lg">
                    <Star size={16} strokeWidth={2.5} />
                </div>
                <h4 className="font-bold text-gray-900 text-[12px]">Feedback & Reviews</h4>
            </div>
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Avg. Rating</span>
                    <span className="text-base font-bold text-gray-900 leading-none">{feedback.avgRating} <span className="text-[10px] font-medium text-gray-400">/ 5</span></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Total Reviews</span>
                    <span className="text-base font-bold text-gray-900 leading-none">{feedback.totalReviews.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-medium mb-1">Negative</span>
                    <span className="text-base font-bold text-[#f43f5e] leading-none">{feedback.negativeReviews}</span>
                </div>
            </div>
            <div className="mt-auto text-center border-t border-gray-50 pt-2">
                <button onClick={() => setIsReviewsModalOpen(true)} className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">View Reviews</button>
            </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#312e81] text-white rounded-lg">
                        <TargetIcon size={16} strokeWidth={2.5} />
                    </div>
                    <h4 className="font-bold text-gray-900 text-[12px]">AI Customer Insights</h4>
                </div>
                <button onClick={() => navigate('/admin/customers')} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">View All</button>
            </div>
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[11px] font-medium text-gray-800">
                        <MoveUpRight size={14} className="text-[#10b981]" strokeWidth={3} /> High value customers
                    </span>
                    <span className="font-bold text-[11px] text-[#10b981]">{aiInsights.highValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[11px] font-medium text-gray-800">
                        <MoveUpRight size={14} className="text-[#3b82f6]" strokeWidth={3} /> Likely to reorder
                    </span>
                    <span className="font-bold text-[11px] text-[#3b82f6]">{aiInsights.likelyToReorder.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[11px] font-medium text-gray-800">
                        <MoveDownRight size={14} className="text-[#f43f5e]" strokeWidth={3} /> At risk (Churn)
                    </span>
                    <span className="font-bold text-[11px] text-[#f43f5e]">{aiInsights.atRisk.toLocaleString()}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Referral Overview Details Modal */}
      <AnimatePresence>
        {isReferralModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setIsReferralModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Link2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Referral Program Details</h2>
                    <p className="text-xs text-gray-500 font-medium">Customer referral tracking and rewards summary</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReferralModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-full shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Referrals</span>
                    <p className="text-xl font-black text-gray-900 mt-1">{referrals.total.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50/50 p-3.5 rounded-2xl border border-green-100 text-center">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Successful</span>
                    <p className="text-xl font-black text-green-700 mt-1">{referrals.successful.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 text-center">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Points Awarded</span>
                    <p className="text-xl font-black text-indigo-700 mt-1">₹{referrals.earnings.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Default Reward Rules</h4>
                  <div className="flex justify-between items-center text-xs py-2 border-b border-gray-200/60">
                    <span className="font-medium text-gray-600">Referrer Bonus (Existing User)</span>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">50 Points</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-2">
                    <span className="font-medium text-gray-600">Referee Bonus (New Signup)</span>
                    <span className="font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">25 Points</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">How Referral Program Works</h4>
                  <ul className="text-xs text-gray-600 space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                      <span>Customers share their unique referral code during friend invitations.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                      <span>When a new user signs up with a valid code, both get loyalty points instantly (amounts set in Settings).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                      <span>Admin decides referrer &amp; new-friend point amounts under Settings → Referral rewards.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center gap-3">
                <button
                  onClick={() => setIsReferralModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsReferralModalOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <Settings size={14} /> Configure Reward Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback & Reviews Details Modal */}
      <AnimatePresence>
        {isReviewsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setIsReviewsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Star size={20} fill="#f59e0b" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Customer Feedback & Reviews</h2>
                    <p className="text-xs text-gray-500 font-medium">Ratings breakdown and feedback analytics</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReviewsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-full shadow-sm"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-center">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Average Rating</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-2xl font-black text-gray-900">{feedback.avgRating}</span>
                      <Star size={18} className="text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Reviews</span>
                    <p className="text-2xl font-black text-gray-900 mt-1">{feedback.totalReviews.toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-center">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Negative (&lt; 3★)</span>
                    <p className="text-2xl font-black text-rose-700 mt-1">{feedback.negativeReviews}</p>
                  </div>
                </div>

                {/* Rating distribution bar */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Rating Breakdown</h4>
                  {[
                    { stars: 5, pct: 75 },
                    { stars: 4, pct: 18 },
                    { stars: 3, pct: 4 },
                    { stars: 2, pct: 2 },
                    { stars: 1, pct: 1 },
                  ].map(({ stars, pct }) => (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-gray-700 w-12 flex items-center gap-1">{stars} <Star size={12} className="text-amber-500 fill-amber-500" /></span>
                      <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 w-10 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Customer Sentiment Summary</h4>
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-800 font-medium">
                    👍 93% positive satisfaction score on tailoring precision & stitching finish.
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-medium">
                    🚚 Delivery punctuality rated 4.8/5 across online and offline customer fulfillments.
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                <button
                  onClick={() => setIsReviewsModalOpen(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-gray-800 transition-all uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRM;
