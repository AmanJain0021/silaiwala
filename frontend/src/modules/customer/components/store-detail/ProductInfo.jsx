import React from 'react';
import { Star, Share2, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';

const ProductInfo = ({ product }) => {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return (
        <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{product.category}</p>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight mt-1">{product.title}</h1>
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
                    {product.rating} <Star size={10} className="fill-current" />
                </div>
                <span className="text-xs text-gray-500 underline">{product.reviews} reviews</span>
            </div>

            {/* Price Block */}
            <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">₹{product.price}</span>
                <span className="text-sm text-gray-400 line-through mb-1">₹{product.originalPrice}</span>
                <span className="text-sm font-bold text-error mb-1">({discount}% OFF)</span>
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
        </div>
    );
};

export default ProductInfo;
