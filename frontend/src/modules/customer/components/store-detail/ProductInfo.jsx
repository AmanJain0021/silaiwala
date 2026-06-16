import React from 'react';
import { Star, Share2, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';

const ProductInfo = ({ product }) => {
    const originalPrice = product.discountPrice || product.originalPrice || product.basePrice || product.price;
    const discount = originalPrice > product.price 
        ? Math.round(((originalPrice - product.price) / originalPrice) * 100) 
        : 0;

    return (
        <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{product.category?.name || product.category || 'Garment'}</p>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight mt-1">{product.title || product.name}</h1>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                    <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <Heart size={20} />
                    </button>
                </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex bg-green-50 px-2 py-0.5 rounded text-green-700 text-xs font-bold items-center gap-1">
                    {product.rating || '4.5'} <Star size={10} className="fill-current" />
                </div>
                <span className="text-xs text-gray-500 underline">{product.reviews || '0'} reviews</span>
            </div>

            {/* Price Block */}
            <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">₹{product.price}</span>
                {originalPrice > product.price && (
                    <>
                        <span className="text-sm text-gray-400 line-through mb-1">₹{originalPrice}</span>
                        <span className="text-sm font-bold text-error mb-1">({discount}% OFF)</span>
                    </>
                )}
            </div>

            {/* Stock & COD Status */}
            <div className="flex items-center gap-4 text-xs font-medium">
                {product.inStock ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={14} /> In Stock
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle size={14} /> Out of Stock
                    </div>
                )}
                {product.codAvailable && (
                    <div className="flex items-center gap-1 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> COD Available
                    </div>
                )}
            </div>

            {/* Detailed Specs */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    {product.brand && (
                        <div><span className="text-gray-500">Brand:</span> <span className="font-semibold text-gray-900">{product.brand}</span></div>
                    )}
                    {product.fabric && (
                        <div><span className="text-gray-500">Fabric:</span> <span className="font-semibold text-gray-900">{product.fabric}</span></div>
                    )}
                    {product.gender && (
                        <div><span className="text-gray-500">Gender:</span> <span className="font-semibold text-gray-900">{product.gender}</span></div>
                    )}
                    {product.pattern && (
                        <div><span className="text-gray-500">Pattern:</span> <span className="font-semibold text-gray-900">{product.pattern}</span></div>
                    )}
                    {product.fitType && (
                        <div><span className="text-gray-500">Fit Type:</span> <span className="font-semibold text-gray-900">{product.fitType}</span></div>
                    )}
                    {product.occasion && (
                        <div><span className="text-gray-500">Occasion:</span> <span className="font-semibold text-gray-900">{product.occasion}</span></div>
                    )}
                    {product.washCare && (
                        <div className="col-span-2"><span className="text-gray-500">Wash Care:</span> <span className="font-semibold text-gray-900">{product.washCare}</span></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductInfo;
