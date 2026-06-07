'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '../services/api';
import RestaurantCard from '../components/RestaurantCard';

function HomeContent() {
  const searchParams = useSearchParams();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [search, setSearch] = useState<string>('');
  const [isVeg, setIsVeg] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');

  // Active Category State for Sticky Nav
  const [activeCategory, setActiveCategory] = useState<string>('all');
  // Collapsible Filters Panel State
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);

  // Synchronize Navbar search updates from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearch(urlSearch);
  }, [searchParams]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await api.get('/restaurants', {
        params: {
          search: search || undefined,
          is_veg: isVeg ? 'true' : undefined,
          rating: minRating || undefined,
          distance: maxDistance || undefined,
          price_range: priceRange || undefined,
        },
      });
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRestaurants();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, isVeg, minRating, maxDistance, priceRange]);

  const clearFilters = (resetCategory = true) => {
    setSearch('');
    setIsVeg(false);
    setMinRating('');
    setMaxDistance('');
    setPriceRange('');
    if (resetCategory) {
      setActiveCategory('all');
    }
  };

  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      // Toggle off
      setActiveCategory('all');
      if (category === 'highest-rated') setMinRating('');
      if (category === 'plant-based') setIsVeg(false);
      if (category === 'local-favorites') setMaxDistance('');
    } else {
      // Toggle on and reset other custom parameters
      setActiveCategory(category);
      clearFilters(false);
      if (category === 'highest-rated') setMinRating('4.5');
      if (category === 'plant-based') setIsVeg(true);
      if (category === 'local-favorites') setMaxDistance('3.0');
    }
  };

  const scrollToRestaurants = () => {
    const element = document.getElementById('restaurant-discovery');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Image assets mapping for cards
  const skeletalAspects = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-square'];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-12 font-utility text-charcoal">
      
      {/* Hero Feature Banner */}
      <section className="relative w-full h-[614px] min-h-[400px] max-h-[600px] rounded-2xl overflow-hidden shadow-soft group">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-95"></div>
        {/* Hero image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80')" 
          }}
        ></div>
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 flex flex-col items-start gap-4">
          <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/30 tracking-wider uppercase">
            Editorial Pick
          </span>
          <h1 className="text-white font-editorial text-4xl md:text-5xl lg:text-6xl font-medium leading-tight max-w-2xl drop-shadow-md">
            The Weekend Gatherings
          </h1>
          <p className="text-white/90 font-utility text-base md:text-lg max-w-xl font-light mb-2 drop-shadow-sm leading-relaxed">
            Sun-drenched patios, shared plates, and curated culinary experiences for your slow weekend mornings.
          </p>
          <button 
            onClick={scrollToRestaurants}
            className="bg-primary text-white font-utility font-medium text-base px-6 py-3 rounded-lg shadow-lg hover:bg-[#c93f10] transition-colors duration-200 flex items-center gap-2 mt-2 cursor-pointer"
          >
            <span>Explore Collection</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Main Discovery Section */}
      <div id="restaurant-discovery" className="scroll-mt-24 space-y-6">
        
        {/* Sticky Filter Bar */}
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md py-4 border-b border-[#E8E6E1]/60">
          <div className="flex overflow-x-auto no-scrollbar gap-8 items-center border-b border-transparent">
            
            <button 
              onClick={() => handleCategoryClick('highest-rated')}
              className={`font-medium text-base pb-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'highest-rated'
                  ? 'text-primary border-primary'
                  : 'text-warm-gray border-transparent hover:text-charcoal hover:border-warm-gray/30'
              }`}
            >
              Highest Rated
            </button>

            <button 
              onClick={() => handleCategoryClick('plant-based')}
              className={`font-medium text-base pb-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'plant-based'
                  ? 'text-primary border-primary'
                  : 'text-warm-gray border-transparent hover:text-charcoal hover:border-warm-gray/30'
              }`}
            >
              Plant-based
            </button>

            <button 
              onClick={() => handleCategoryClick('carnivore')}
              className={`font-medium text-base pb-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'carnivore'
                  ? 'text-primary border-primary'
                  : 'text-warm-gray border-transparent hover:text-charcoal hover:border-warm-gray/30'
              }`}
            >
              Carnivore
            </button>

            <button 
              onClick={() => handleCategoryClick('local-favorites')}
              className={`font-medium text-base pb-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'local-favorites'
                  ? 'text-primary border-primary'
                  : 'text-warm-gray border-transparent hover:text-charcoal hover:border-warm-gray/30'
              }`}
            >
              Local Favorites
            </button>

            <button 
              onClick={() => clearFilters(true)}
              className={`font-medium text-base pb-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === 'all' && !search && !minRating && !maxDistance && !priceRange
                  ? 'text-primary border-primary'
                  : 'text-warm-gray border-transparent hover:text-charcoal hover:border-warm-gray/30'
              }`}
            >
              New Additions
            </button>

            {/* Toggle Collapsible Filters Panel */}
            <button 
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`ml-auto flex items-center gap-2 text-sm font-semibold transition-colors cursor-pointer ${
                showMoreFilters || search || minRating || maxDistance || priceRange
                  ? 'text-primary'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span className="hidden sm:inline">More Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible More Filters Panel */}
        {(showMoreFilters || search || minRating || maxDistance || priceRange) && (
          <div className="bg-slate-50 rounded-xl p-6 border border-[#E8E6E1] space-y-4 transition-all duration-300">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h4 className="font-editorial text-xl font-medium text-charcoal">Filter Options</h4>
              {(search || isVeg || minRating || maxDistance || priceRange) && (
                <button 
                  onClick={() => clearFilters(true)}
                  className="text-xs font-bold text-warm-gray hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Reset Filters
                </button>
              )}
            </div>

            {/* Input Search Field (local toggle) */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-warm-gray">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#E8E6E1] bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal placeholder-warm-gray focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                placeholder="Search for restaurants, cuisines, or dishes..."
              />
            </div>

            {/* Granular drop-down grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rating */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-charcoal">Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E6E1] bg-white py-2 px-3 text-sm text-charcoal outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">Any Rating</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              {/* Distance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-charcoal">Distance</label>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E6E1] bg-white py-2 px-3 text-sm text-charcoal outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">Any Distance</option>
                  <option value="1.5">Under 1.5 km</option>
                  <option value="3.0">Under 3.0 km</option>
                  <option value="5.0">Under 5.0 km</option>
                </select>
              </div>

              {/* Price range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-charcoal">Price Class</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full rounded-lg border border-[#E8E6E1] bg-white py-2 px-3 text-sm text-charcoal outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="">Any Price</option>
                  <option value="$">$ (Low Cost)</option>
                  <option value="$$">$$ (Moderate)</option>
                  <option value="$$$">$$$ (Premium)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Masonry Grid Content */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-editorial text-charcoal font-medium">
              Available Kitchens
            </h2>
            <span className="text-xs font-semibold text-warm-gray">
              Showing {restaurants.length} curated places
            </span>
          </div>

          {loading ? (
            <div className="masonry-grid pb-20">
              {[1, 2, 3, 4, 5, 6].map((i, idx) => {
                const aspect = skeletalAspects[idx % skeletalAspects.length];
                return (
                  <div key={i} className="masonry-item bg-white border border-[#E8E6E1] rounded-xl overflow-hidden shadow-soft animate-pulse">
                    <div className={`bg-slate-100 w-full ${aspect}`} />
                    <div className="p-5 space-y-3">
                      <div className="bg-slate-100 h-6 rounded w-3/4 animate-pulse" />
                      <div className="bg-slate-100 h-4 rounded w-1/2 animate-pulse" />
                      <div className="border-t border-[#E8E6E1] pt-3 flex justify-between gap-4">
                        <div className="bg-slate-100 h-4 rounded w-1/4 animate-pulse" />
                        <div className="bg-slate-100 h-4 rounded w-1/4 animate-pulse" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="masonry-grid pb-20">
              {restaurants.map((restaurant, index) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-[#E8E6E1] rounded-xl">
              <span className="material-symbols-outlined text-warm-gray text-5xl mb-4">tune</span>
              <h3 className="text-lg font-bold text-charcoal mb-1 font-editorial">
                No Restaurants Found
              </h3>
              <p className="text-sm text-warm-gray mb-6">
                We couldn't find any places matching your criteria. Try adjusting your filters.
              </p>
              <button
                onClick={() => clearFilters(true)}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg bg-primary hover:bg-[#c93f10] shadow-soft cursor-pointer transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="w-full text-center py-20 text-warm-gray font-medium">
        Loading QuickBite Discovery...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
