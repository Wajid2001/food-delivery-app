'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface FoodItem {
  id: number;
  restaurant_id: number;
  name: string;
  price: string | number;
  image: string;
  category: string;
  description: string;
  is_veg: boolean;
}

export default function FoodItemCard({
  food,
  initialQuantity = 0,
  onQuantityChange
}: {
  food: FoodItem;
  initialQuantity?: number;
  onQuantityChange?: (qty: number) => void;
}) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [loading, setLoading] = useState<boolean>(false);
  const priceNum = parseFloat(food.price as string) || 0;

  const updateCartQuantity = async (newQty: number) => {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return;
    }
    if (user.role !== 'customer') {
      alert('Only customers can manage their cart.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/cart/add', {
        food_id: food.id,
        quantity: newQty,
        replace: true
      });
      
      setQuantity(newQty);
      if (onQuantityChange) {
        onQuantityChange(newQty);
      }
      
      // Dispatch custom event to notify Navbar and other components
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: any) {
      console.error('Error updating cart quantity:', error);
      alert(error.response?.data?.message || 'Failed to update cart. Note: You can only order from one restaurant at a time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-4 flex space-x-4 hover:shadow-md transition-shadow">
      {/* Food Image */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        <img
          src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
          alt={food.name}
          className="h-full w-full object-cover"
        />
        <span
          className={`absolute top-1.5 left-1.5 h-4 w-4 border rounded flex items-center justify-center bg-white`}
          title={food.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
        >
          <span className={`h-2 w-2 rounded-full ${food.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col flex-grow min-w-0">
        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">{food.name}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2 flex-grow">{food.description}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">${priceNum.toFixed(2)}</span>
          
          {/* Controls */}
          {user && user.role !== 'customer' ? null : (
            <div>
              {quantity > 0 ? (
                <div className="flex items-center space-x-2 border border-orange-200 dark:border-orange-950 rounded-lg px-2 py-1 bg-orange-50/50 dark:bg-orange-950/20">
                  <button
                    onClick={() => updateCartQuantity(quantity - 1)}
                    disabled={loading}
                    className="p-0.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-950 rounded disabled:opacity-50 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-200">{quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(quantity + 1)}
                    disabled={loading}
                    className="p-0.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-950 rounded disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => updateCartQuantity(1)}
                  disabled={loading}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white border border-orange-200 dark:border-orange-900 rounded-lg text-orange-600 dark:text-orange-400 text-xs font-bold transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
