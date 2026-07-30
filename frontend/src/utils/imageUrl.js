import { SOCKET_URL } from '../config/constants';

export const getImageUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    const separator = img.startsWith('/') ? '' : '/';
    return `${SOCKET_URL}${separator}${img}`;
};
