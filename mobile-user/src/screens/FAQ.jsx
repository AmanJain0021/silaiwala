// Port of modules/customer/pages/FAQ.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import HtmlView from '../components/ui/HtmlView';
import React, { useEffect, useState } from "react";
import { ArrowLeft, HelpCircle, ChevronDown, Loader2 } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import BottomNav from "../components/customer/BottomNav";
import { Box, Btn, Txt, I, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const DEFAULT_FAQS = [{
  slug: 'what-is-sewzella',
  title: 'What is SewZella?',
  content: '<p>SewZella is an all-in-one digital tailoring marketplace that connects customers with verified expert tailors, boutiques, and fashion designers. We handle fabric pickup, professional body measurements, custom stitching, quality checks, and doorstep delivery — bringing premium tailor-made clothing directly to your home with a Perfect Fit Guarantee.</p>'
}, {
  slug: 'can-i-choose-my-own-tailor',
  title: 'Can I choose my own tailor?',
  content: '<p>Yes, absolutely! SewZella allows you to browse verified local tailors and boutiques, view their ratings, specialized craftsmanship (e.g., Suits, Sarees, Lehengas, Alterations), pricing, and portfolio before making a selection. You can pick your preferred tailor or let our smart system automatically match you with the highest-rated expert near you.</p>'
}, {
  slug: 'can-i-track-my-order',
  title: 'Can I track my order?',
  content: '<p>Yes, real-time order tracking is available! Once your order is placed, you can follow every stage of the process under <strong>My Orders</strong> — from pickup by our executive, fabric arrival at the workshop, cutting, stitching, quality inspection, to final delivery to your doorstep.</p>'
}, {
  slug: 'can-i-upload-my-own-design',
  title: 'Can I upload my own design?',
  content: '<p>Yes! You can upload reference images, sketches, or photos from Pinterest/Instagram when customizing your service. You can also specify neck designs, sleeve styles, linings, and special stitching preferences directly in the app.</p>'
}, {
  slug: 'do-you-offer-pickup-and-delivery',
  title: 'Do you offer pickup and delivery?',
  content: '<p>Yes! We provide convenient doorstep pickup and delivery services. Our trained Measurement Executive visits your address to collect your fabric and reference garments, and delivers the finished, custom-stitched outfit back to your door once completed.</p>'
}, {
  slug: 'how-do-i-create-an-account',
  title: 'How do I create an account?',
  content: '<p>Creating an account is fast and easy. Simply enter your mobile phone number on the login screen, enter the OTP sent via SMS, and complete your basic profile with your name and address. You are ready to start placing orders!</p>'
}, {
  slug: 'how-do-i-place-an-order',
  title: 'How do I place an order?',
  content: '<p>Placing an order takes just a few simple steps:</p><ul className="list-disc ml-5 space-y-1.5 mt-2"><li>Select a service category (e.g., Kurti, Lehenga, Suit, Alteration).</li><li>Customize style details and upload reference designs.</li><li>Select your preferred tailor or opt for auto-assign.</li><li>Choose your measurement method (at-home executive visit or sample garment pickup).</li><li>Confirm address and make payment.</li></ul>'
}, {
  slug: 'how-do-i-provide-my-measurements',
  title: 'How do I provide my measurements?',
  content: '<p>You have three flexible options:</p><ul className="list-disc ml-5 space-y-1.5 mt-2"><li><strong>Doorstep Executive Visit:</strong> Schedule a visit by a professional SewZella measurement executive.</li><li><strong>Sample Garment Pickup:</strong> Send a perfect-fitting sample garment along with your fabric during pickup.</li><li><strong>Saved Profile:</strong> Save and manage your custom body measurements directly in your app profile.</li></ul>'
}, {
  slug: 'is-my-payment-secure',
  title: 'Is my payment secure?',
  content: '<p>Yes, 100% secure! All payments are processed through trusted PCI-DSS compliant payment gateways (UPI, Cards, Netbanking, Wallets). We use end-to-end SSL encryption to safeguard all transaction details.</p>'
}, {
  slug: 'where-is-sewzella-available',
  title: 'Where is SewZella available?',
  content: '<p>SewZella is rapidly expanding across major cities. Enter your pin code or enable location services in the app to see all tailors and pickup services active in your area.</p>'
}, {
  slug: 'which-payment-methods-are-accepted',
  title: 'Which payment methods are accepted?',
  content: '<p>We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across major banks, Wallet payments, and Cash on Delivery (COD) for eligible locations.</p>'
}, {
  slug: 'fitting-guarantee',
  title: 'What if the outfit does not fit properly?',
  content: '<p>Every order is covered by our <strong>Perfect Fit Guarantee</strong>! If your outfit needs adjustments, request a free alteration within 7 days of delivery, and our team will pick it up, refine the fit, and deliver it back to you at zero extra charge.</p>'
}];
const FAQItem = ({
  item
}) => {
  const [open, setOpen] = useState(false);
  return <Box className={`bg-white rounded-2xl border transition-all duration-300 shadow-xs ${open ? 'border-[#843D9B]/40 shadow-md ring-1 ring-[#843D9B]/10' : 'border-gray-100 hover:border-purple-200'}`}>
            <Btn className={`w-full flex justify-between items-center p-4 text-left cursor-pointer transition-colors ${open ? 'bg-purple-50/40 rounded-t-2xl' : 'hover:bg-purple-50/20 rounded-2xl'}`} onPress={() => setOpen(!open)}>
                <Txt className={`text-xs sm:text-sm font-bold pr-3 leading-snug transition-colors ${open ? 'text-[#843D9B]' : 'text-gray-800'}`}>
                    {item.title}
                </Txt>
                <Box className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${open ? 'bg-[#843D9B] text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                    <I icon={ChevronDown} size={16} />
                </Box>
            </Btn>
            {open && <HtmlView html={item.content} className="px-4.5 pb-4 pt-3.5 border-t border-purple-50 bg-white rounded-b-2xl space-y-2" textClassName="text-xs text-gray-700 leading-relaxed" />}
        </Box>;
};
const FAQ = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/cms/content?type=faq&category=customer');
        let list = res.data?.data || [];
        if (list.length === 0) {
          const all = await api.get('/cms/content?type=faq');
          list = all.data?.data || [];
        }

        // Ensure every FAQ item has a full, non-truncated detailed answer
        const finalFaqs = DEFAULT_FAQS.map(defaultFaq => {
          const dbMatch = list.find(item => item.slug === defaultFaq.slug || item.title?.toLowerCase() === defaultFaq.title?.toLowerCase());
          if (dbMatch && dbMatch.content) {
            const cleanText = dbMatch.content.replace(/<[^>]*>/g, '').trim();
            // If DB text is full and detailed (>60 chars), use DB version; otherwise fallback to rich default answer
            if (cleanText.length > 60) {
              return dbMatch;
            }
          }
          return defaultFaq;
        });

        // Add any additional unique valid FAQs from DB if present
        list.forEach(dbItem => {
          const exists = finalFaqs.some(f => f.slug === dbItem.slug || f.title?.toLowerCase() === dbItem.title?.toLowerCase());
          if (!exists && dbItem.content && dbItem.content.length > 30) {
            finalFaqs.push(dbItem);
          }
        });
        setFaqs(finalFaqs);
      } catch {
        setFaqs(DEFAULT_FAQS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return <Screen className="bg-[#F8F9FB]" bottom={false} statusBg="bg-[#843D9B]" statusBar="light"><Box className="flex-1 bg-[#F8F9FB] font-sans">
            <Box className="sticky top-0 z-50 bg-[#843D9B] px-4 py-4 flex items-center gap-3 text-white shadow-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Txt className="text-sm font-black tracking-tight">Help &amp; FAQs</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-28">

            <Box className="max-w-lg mx-auto px-4 py-6 space-y-4">
                <Box className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-3">
                    <Box className="w-11 h-11 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0">
                        <I icon={HelpCircle} size={22} />
                    </Box>
                    <Box>
                        <Txt className="text-sm font-bold text-gray-900">Frequently asked questions</Txt>
                        <Txt className="text-[11px] text-gray-500 mt-0.5">Find quick answers about orders, stitching &amp; delivery</Txt>
                    </Box>
                </Box>

                {loading ? <Box className="flex justify-center py-16 text-gray-400 gap-2 text-xs font-bold">
                        <Spin size={18} className="animate-spin text-[#843D9B]" /> Loading FAQs…
                    </Box> : faqs.length === 0 ? <Box className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
                        <Txt className="text-sm font-bold text-gray-700 mb-2">No FAQs published yet</Txt>
                        <Txt className="text-xs text-gray-500 mb-4">Contact support for help with your order.</Txt>
                        <Btn onPress={() => navigate('/user/support')} className="px-5 py-2.5 rounded-xl bg-[#843D9B] text-white text-xs font-bold cursor-pointer">
                            Go to Support
                        </Btn>
                    </Box> : <Box className="space-y-3">
                        {faqs.map(faq => <FAQItem key={faq._id || faq.slug} item={faq} />)}
                    </Box>}

                <Btn onPress={() => navigate('/user/support')} className="w-full py-3.5 rounded-xl border border-[#843D9B]/20 bg-white text-sm font-bold text-[#843D9B] hover:bg-purple-50 transition-colors cursor-pointer shadow-xs">
                    Still need help? Contact Support
                </Btn>
            </Box>

                        </Scroll>
<BottomNav />
        </Box></Screen>;
};
export default FAQ;