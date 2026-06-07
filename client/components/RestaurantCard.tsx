import React from 'react';
import Link from 'next/link';

interface Restaurant {
  id: number;
  name: string;
  image: string;
  address: string;
  rating: string | number;
  cuisine: string;
  distance: string | number;
  delivery_time: number;
  price_range: string;
  is_veg: boolean;
}

export default function RestaurantCard({ restaurant, index = 0 }: { restaurant: Restaurant; index?: number }) {
  const ratingNum = parseFloat(restaurant.rating as string) || 0;
  
  // Assign dynamic aspect ratios for masonry grid flow
  const aspectClasses = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-square'];
  const aspectClass = aspectClasses[index % aspectClasses.length];

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="masonry-item block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-soft-hover transition-all duration-300 cursor-pointer flex flex-col h-full border border-[#E8E6E1]">
        {/* Image Section */}
        <div className={`relative overflow-hidden ${aspectClass} bg-slate-50`}>
          <img
            src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:saturate-110"
            loading="lazy"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="material-symbols-outlined text-charcoal text-[20px]">favorite_border</span>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-editorial text-2xl text-charcoal font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1 bg-white border border-[#E8E6E1]/80 px-2 py-1 rounded-md shrink-0">
              <span className="material-symbols-outlined text-[16px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-utility text-sm font-medium">{ratingNum > 0 ? ratingNum.toFixed(1) : 'New'}</span>
            </div>
          </div>

          <p className="font-utility text-warm-gray text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">
            {restaurant.cuisine || 'Curated dishes and seasonal menu items prepared with fresh ingredients.'}
          </p>

          <div className="mt-auto flex items-center gap-4 text-xs font-medium text-warm-gray border-t border-[#E8E6E1]/80 pt-3">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>{restaurant.delivery_time} min</span>
            </div>
            {restaurant.is_veg ? (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">eco</span>
                <span className="text-sage font-semibold">Veg friendly</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                <span className="text-primary font-semibold">Trending</span>
              </div>
            )}
            <div className="ml-auto text-[9px] font-bold px-2 py-0.5 bg-slate-50 text-charcoal border border-[#E8E6E1] rounded">
              {restaurant.price_range}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
