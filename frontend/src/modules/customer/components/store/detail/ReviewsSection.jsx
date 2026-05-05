import React from 'react';
import { Star, User } from 'lucide-react';

const REVIEWS = [
    { id: 1, name: 'Aditi Sharma', rating: 5, date: '10 Feb 2026', comment: 'Absolutely loved the fit and fabric! Very comfortable and looks exactly like the picture.' },
    { id: 2, name: 'Priya Mehta', rating: 4, date: '05 Feb 2026', comment: 'Good quality but delivery took a bit long. Otherwise great product.' },
    { id: 3, name: 'Riya Singh', rating: 5, date: '01 Feb 2026', comment: 'Perfect for everyday wear. The embroidery is very neat.' },
];

const ReviewsSection = () => {
    return (
        <div className="bg-white rounded-lg p-6 mt-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                Ratings & Reviews <span className="text-sm font-normal text-gray-500">(120)</span>
            </h3>

            {/* Simulating Ratings Breakdown (Visual placeholder) */}
            <div className="flex gap-4 mb-8">
                <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg text-center w-32">
                    <span className="text-4xl font-bold text-green-700">4.5</span>
                    <div className="flex text-yellow-400 mt-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-current' : 'text-gray-300 fill-none'}`} />
                        ))}
                    </div>
                </div>

                {/* Visual Bars */}
                <div className="flex-1 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <span>5★</span>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full w-[70%]"></div>
                        </div>
                        <span>84</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>4★</span>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full w-[20%]"></div>
                        </div>
                        <span>24</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>3★</span>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full w-[5%]"></div>
                        </div>
                        <span>6</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>2★</span>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full w-[3%]"></div>
                        </div>
                        <span>4</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>1★</span>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full w-[2%]"></div>
                        </div>
                        <span>2</span>
                    </div>
                </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
                {REVIEWS.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800">{review.name}</h4>
                                <div className="flex gap-2 text-xs text-gray-500">
                                    <div className="flex text-green-600">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300 fill-none'}`} />
                                        ))}
                                    </div>
                                    <span>• {review.date}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-11">{review.comment}</p>
                    </div>
                ))}
            </div>

            <button className="w-full mt-6 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                View All Reviews
            </button>
        </div>
    );
};

export default ReviewsSection;
