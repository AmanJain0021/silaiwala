export const ADMIN_WHATSAPP_NUMBER = '919429692921';

export const buildWhatsAppUrl = (message = '', phone = ADMIN_WHATSAPP_NUMBER) => {
    const cleanPhone = String(phone || ADMIN_WHATSAPP_NUMBER).replace(/\D/g, '');
    const query = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://api.whatsapp.com/send?phone=${cleanPhone}${query}`;
};

export const openAdminWhatsApp = (message = '') => {
    if (typeof window === 'undefined') return;
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
};
