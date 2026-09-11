import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ZoomIn, 
    ZoomOut, 
    RotateCw, 
    ExternalLink, 
    Download, 
    FileText, 
    Image as ImageIcon, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Eye,
    FileCheck
} from 'lucide-react';

/**
 * Checks if a given URL is likely an image
 */
export const isImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.match(/\.(jpeg|jpg|png|webp|svg|gif|bmp|avif)$/i)) return true;
    if (url.includes('cloudinary.com') && !cleanUrl.endsWith('.pdf')) return true;
    if (url.startsWith('data:image/')) return true;
    if (url.startsWith('blob:')) return true;
    return true; // Default to true so standard image upload URLs render as images with fallback
};

/**
 * Checks if a given URL is a PDF
 */
export const isPdfUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const cleanUrl = url.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.pdf') || url.includes('/raw/upload/') && url.endsWith('.pdf');
};

/**
 * Standard Document Preview & Lightbox Modal
 */
export const DocumentViewerModal = ({ doc, isOpen, onClose }) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setRotation(0);
        }
    }, [isOpen, doc]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !doc) return null;

    const docUrl = typeof doc === 'string' ? doc : doc.url || doc.file || doc.path || '';
    const docName = typeof doc === 'string' ? 'Document Preview' : doc.name || doc.title || 'Document Preview';
    const isImage = isImageUrl(docUrl) && !isPdfUrl(docUrl);
    const isPdf = isPdfUrl(docUrl);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => { setScale(1); setRotation(0); };
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 cursor-pointer"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-neutral-950/80 border-b border-neutral-800 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-white">{docName}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                        {isPdf ? 'PDF Document' : isImage ? 'Image File' : 'Attachment'}
                                    </span>
                                    {doc.status && (
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            doc.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                            doc.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                            'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                        }`}>
                                            {doc.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            {isImage && (
                                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
                                    <button
                                        onClick={handleZoomOut}
                                        title="Zoom Out"
                                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                    <button
                                        onClick={handleResetZoom}
                                        title="Reset Zoom"
                                        className="px-2 py-1 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                    >
                                        {Math.round(scale * 100)}%
                                    </button>
                                    <button
                                        onClick={handleZoomIn}
                                        title="Zoom In"
                                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                    <div className="h-4 w-px bg-neutral-800 mx-1" />
                                    <button
                                        onClick={handleRotate}
                                        title="Rotate 90°"
                                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                                    >
                                        <RotateCw size={16} />
                                    </button>
                                </div>
                            )}

                            <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in New Tab"
                                className="p-2 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors"
                            >
                                <ExternalLink size={16} />
                            </a>

                            <button
                                onClick={onClose}
                                title="Close (Esc)"
                                className="p-2 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Viewer Content Area */}
                    <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-neutral-950/40 min-h-[400px]">
                        {isPdf ? (
                            <div className="w-full h-[65vh] flex flex-col items-center justify-center">
                                <iframe
                                    src={`${docUrl}#toolbar=0`}
                                    title={docName}
                                    className="w-full h-full rounded-2xl border border-neutral-800 bg-white"
                                />
                            </div>
                        ) : isImage ? (
                            <div className="overflow-auto flex items-center justify-center max-w-full max-h-[70vh]">
                                <motion.img
                                    src={docUrl}
                                    alt={docName}
                                    animate={{ scale, rotate: rotation }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                                    className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div style={{ display: 'none' }} className="flex flex-col items-center justify-center p-12 text-center text-neutral-400">
                                    <AlertCircle size={48} className="text-amber-500 mb-3" />
                                    <p className="text-base font-bold text-white">Could not display image directly</p>
                                    <p className="text-xs text-neutral-400 mt-1 max-w-md">The file might be a PDF or private storage link.</p>
                                    <a
                                        href={docUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-primary-dark transition-colors"
                                    >
                                        <ExternalLink size={14} /> Open Document Externally
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <FileText size={56} className="text-neutral-500 mb-4" />
                                <p className="text-lg font-black text-white">{docName}</p>
                                <p className="text-xs text-neutral-400 mt-1">This file format is best viewed in an external window.</p>
                                <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-primary-dark shadow-lg shadow-purple-950/40 transition-all"
                                >
                                    <ExternalLink size={14} /> Open File
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

/**
 * Grid Component to render list of documents with rich cards & lightbox preview
 */
export const AdminDocumentGrid = ({ documents = [], onPreview, title = "Submitted Documents" }) => {
    if (!documents || documents.length === 0) {
        return (
            <div className="p-6 bg-gray-50/80 border border-dashed border-gray-200 rounded-2xl text-center">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Document Attachments Uploaded</p>
                <p className="text-[11px] text-gray-400 mt-1">The user did not upload any separate document files during registration.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {title && (
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <FileCheck size={13} className="text-primary" /> {title} ({documents.length})
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400">Click any card to preview</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {documents.map((doc, idx) => {
                    const url = typeof doc === 'string' ? doc : doc.url || doc.file || '';
                    const name = typeof doc === 'string' ? `Document ${idx + 1}` : doc.name || doc.title || `Document ${idx + 1}`;
                    const status = typeof doc === 'object' ? doc.status : null;
                    const isImg = isImageUrl(url) && !isPdfUrl(url);

                    return (
                        <div
                            key={idx}
                            className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group relative overflow-hidden"
                        >
                            <div className="flex items-start gap-3">
                                {/* Thumbnail */}
                                <div 
                                    onClick={() => onPreview({ ...doc, name, url })}
                                    className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative group/thumb"
                                >
                                    {isImg && url ? (
                                        <>
                                            <img
                                                src={url}
                                                alt={name}
                                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div style={{ display: 'none' }} className="w-full h-full items-center justify-center text-gray-400">
                                                <FileText size={20} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-primary">
                                            <FileText size={24} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                        <Eye size={16} className="text-white drop-shadow-md" />
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                        <h5 className="text-xs font-black text-gray-900 truncate" title={name}>
                                            {name}
                                        </h5>
                                        {status && (
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                                                status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                        {isImg ? <ImageIcon size={10} /> : <FileText size={10} />}
                                        {isImg ? 'Photo / Image' : 'Document File'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions bar */}
                            <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => onPreview({ ...doc, name, url })}
                                    className="flex-1 py-1.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                                >
                                    <Eye size={11} /> Preview
                                </button>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold transition-colors"
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
