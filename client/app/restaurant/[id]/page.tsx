'use client';

import React, { use, useEffect, useState } from 'react';
import { useAuth } from '../../../components/AuthContext';
import api from '../../../services/api';
import FoodItemCard from '../../../components/FoodItemCard';
import { Star, MapPin, Clock, MessageSquare, Plus, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Menu Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartQuantities, setCartQuantities] = useState<{ [key: number]: number }>({});

  // Review Form States
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await api.get(`/restaurants/${id}`);
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  const fetchCartQuantities = async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const response = await api.get('/cart');
      const qtyMap: { [key: number]: number } = {};
      response.data.forEach((item: any) => {
        qtyMap[item.food_id] = item.quantity;
      });
      setCartQuantities(qtyMap);
    } catch (error) {
      console.error('Error fetching cart quantities:', error);
    }
  };

  const loadPageData = async () => {
    setLoading(true);
    await Promise.all([fetchRestaurantDetails(), fetchCartQuantities()]);
    setLoading(false);
  };

  useEffect(() => {
    loadPageData();
  }, [id, user]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/restaurants/${id}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      // Refresh details to show new review and updated average rating
      await fetchRestaurantDetails();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Restaurant not found.</h2>
        <Link href="/" className="text-orange-500 hover:underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  // Get unique categories from menu items
  const categories = ['All', ...new Set(restaurant.foods.map((food: any) => food.category))] as string[];

  // Filter foods by category
  const filteredFoods = selectedCategory === 'All'
    ? restaurant.foods
    : restaurant.foods.filter((food: any) => food.category === selectedCategory);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center space-x-1 text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to restaurants</span>
      </Link>

      {/* Restaurant Header */}
      <div className="relative rounded-3xl overflow-hidden h-64 md:h-80 shadow-md">
        <img
          src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {/* Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        
        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {restaurant.is_veg && (
              <span className="bg-green-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider shadow">
                Veg Only
              </span>
            )}
            <span className="bg-orange-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider shadow">
              {restaurant.price_range}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
            {restaurant.name}
          </h1>
          <p className="text-sm text-slate-200 font-medium max-w-xl">{restaurant.address}</p>

          <div className="flex flex-wrap gap-6 items-center text-xs font-bold text-slate-300 pt-1">
            <span className="flex items-center space-x-1.5">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="text-white text-sm">{(parseFloat(restaurant.rating) || 0.0).toFixed(1)}</span>
              <span className="text-slate-400">({restaurant.reviews?.length || 0} reviews)</span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{restaurant.distance} km away</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{restaurant.delivery_time} mins delivery</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Menu Items (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === category
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFoods.length > 0 ? (
              filteredFoods.map((food: any) => (
                <FoodItemCard
                  key={food.id}
                  food={food}
                  initialQuantity={cartQuantities[food.id] || 0}
                  onQuantityChange={(qty) => {
                    setCartQuantities((prev) => ({
                      ...prev,
                      [food.id]: qty,
                    }));
                  }}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-slate-500 text-sm">
                No items available in this category.
              </div>
            )}
          </div>
        </div>

        {/* Reviews and Ratings Panel (Right 1 col) */}
        <div className="space-y-6">
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm space-y-6">
            <h3 className="font-extrabold text-lg flex items-center space-x-2 text-slate-950 dark:text-slate-50">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              <span>Ratings & Reviews</span>
            </h3>

            {/* Leave Review Form */}
            {user && user.role === 'customer' && (
              <form onSubmit={handleReviewSubmit} className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Your Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setRating(stars)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            stars <= rating
                              ? 'text-amber-400 fill-current'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Comments
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-3 text-sm placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none"
                    placeholder="Describe your dining or ordering experience..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex w-full justify-center items-center rounded-xl py-2.5 text-xs font-bold shadow-sm btn-primary-gradient disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {restaurant.reviews && restaurant.reviews.length > 0 ? (
                restaurant.reviews.map((rev: any) => (
                  <div key={rev.id} className="border-b border-slate-50 dark:border-slate-900 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{rev.user_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex space-x-0.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= rev.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  No reviews yet. Be the first to review!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
