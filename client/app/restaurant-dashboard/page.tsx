'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import api from '../../services/api';
import { Plus, Edit3, Trash2, Loader2, Store, PlusCircle, Check, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantDashboardPage() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [foods, setFoods] = useState<any[]>([]);

  // Restaurant creation form
  const [restName, setRestName] = useState('');
  const [restCuisine, setRestCuisine] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restImage, setRestImage] = useState('');
  const [restIsVeg, setRestIsVeg] = useState(false);

  // Food item form
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [foodDescription, setFoodDescription] = useState('');
  const [foodImage, setFoodImage] = useState('');
  const [foodIsVeg, setFoodIsVeg] = useState(true);

  const [formLoading, setFormLoading] = useState(false);

  const fetchRestaurantAndFoods = async () => {
    if (!user) return;
    try {
      // Find all restaurants
      const resResult = await api.get('/restaurants');
      // Find restaurant owned by current user
      const owned = resResult.data.find((r: any) => r.owner_id === user.id);
      
      if (owned) {
        setRestaurant(owned);
        // Fetch foods for this restaurant
        const foodResult = await api.get(`/foods?restaurant_id=${owned.id}`);
        setFoods(foodResult.data);
      } else {
        setRestaurant(null);
      }
    } catch (error) {
      console.error('Error loading restaurant dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRestaurantAndFoods();
    }
  }, [user]);

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restName || !restAddress) {
      alert('Name and Address are required.');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/restaurants', {
        name: restName,
        cuisine: restCuisine,
        address: restAddress,
        image: restImage || undefined,
        is_veg: restIsVeg
      });
      await fetchRestaurantAndFoods();
    } catch (error) {
      console.error('Error creating restaurant:', error);
      alert('Failed to register restaurant.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFood(null);
    setFoodName('');
    setFoodPrice('');
    setFoodCategory('');
    setFoodDescription('');
    setFoodImage('');
    setFoodIsVeg(true);
    setShowFoodModal(true);
  };

  const handleOpenEditModal = (food: any) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodPrice(food.price.toString());
    setFoodCategory(food.category);
    setFoodDescription(food.description);
    setFoodImage(food.image);
    setFoodIsVeg(food.is_veg);
    setShowFoodModal(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodPrice || !foodCategory) {
      alert('Name, Price, and Category are required.');
      return;
    }
    setFormLoading(true);
    try {
      if (editingFood) {
        // Edit food
        await api.put(`/foods/${editingFood.id}`, {
          name: foodName,
          price: foodPrice,
          category: foodCategory,
          description: foodDescription,
          image: foodImage || undefined,
          is_veg: foodIsVeg
        });
      } else {
        // Add new food
        await api.post('/foods', {
          restaurant_id: restaurant.id,
          name: foodName,
          price: foodPrice,
          category: foodCategory,
          description: foodDescription,
          image: foodImage || undefined,
          is_veg: foodIsVeg
        });
      }
      setShowFoodModal(false);
      await fetchRestaurantAndFoods();
    } catch (error) {
      console.error('Error saving food item:', error);
      alert('Failed to save food item.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFood = async (foodId: number) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;
    try {
      await api.delete(`/foods/${foodId}`);
      await fetchRestaurantAndFoods();
    } catch (error) {
      console.error('Error deleting food item:', error);
      alert('Failed to delete food item.');
    }
  };

  if (!user || user.role !== 'restaurant') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">Access Denied: Restaurant Owner account required.</h2>
        <Link href="/login" className="px-5 py-2.5 rounded-xl btn-primary-gradient shadow font-bold text-sm">
          Log in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* If Owner does not have a restaurant registered yet */}
      {!restaurant ? (
        <div className="max-w-xl mx-auto bg-card text-card-foreground border border-border rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <Store className="mx-auto h-12 w-12 text-orange-500" />
            <h2 className="text-2xl font-black tracking-tight">Register Your Restaurant</h2>
            <p className="text-sm text-slate-500">
              Set up your profile to start listing food items and accepting orders.
            </p>
          </div>

          <form onSubmit={handleCreateRestaurant} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={restName}
                onChange={(e) => setRestName(e.target.value)}
                placeholder="e.g. Burger Palace"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cuisine types
                </label>
                <input
                  type="text"
                  value={restCuisine}
                  onChange={(e) => setRestCuisine(e.target.value)}
                  placeholder="e.g. Burgers, Pizza"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col justify-end pb-3">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restIsVeg}
                    onChange={(e) => setRestIsVeg(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span>Pure Vegetarian</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Store Address
              </label>
              <input
                type="text"
                required
                value={restAddress}
                onChange={(e) => setRestAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Food City"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={restImage}
                onChange={(e) => setRestImage(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="flex w-full justify-center items-center rounded-xl py-3 text-sm font-bold shadow-md btn-primary-gradient disabled:opacity-50 transition-all cursor-pointer"
            >
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Storefront...
                </>
              ) : (
                'Register Restaurant'
              )}
            </button>
          </form>
        </div>
      ) : (
        /* If Restaurant is registered */
        <div className="space-y-8">
          {/* Cover Header */}
          <div className="bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center md:space-x-6">
            <img
              src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300'}
              alt={restaurant.name}
              className="h-24 w-32 object-cover rounded-2xl bg-slate-100 dark:bg-slate-800 border"
            />
            <div className="space-y-1 mt-4 md:mt-0 text-center md:text-left flex-grow">
              <div className="flex justify-center md:justify-start items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-950 dark:text-slate-50">{restaurant.name}</h1>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border text-slate-500 font-bold px-2 py-0.5 rounded uppercase">
                  {restaurant.price_range}
                </span>
                {restaurant.is_veg && (
                  <span className="text-[10px] bg-green-600 text-white font-bold px-2 py-0.5 rounded uppercase">
                    Veg
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">{restaurant.cuisine}</p>
              <p className="text-xs text-slate-500 italic">{restaurant.address}</p>
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="mt-4 md:mt-0 flex items-center space-x-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Menu Item</span>
            </button>
          </div>

          {/* Menu Items List */}
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Manage Menu Items
            </h2>

            {foods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foods.map((food) => (
                  <div key={food.id} className="bg-card text-card-foreground border border-border rounded-2xl p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center space-x-4 min-w-0">
                      <img
                        src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                        alt={food.name}
                        className="h-16 w-16 object-cover rounded-xl shrink-0 border"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${food.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{food.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{food.category}</p>
                        <span className="font-extrabold text-xs text-orange-600 dark:text-orange-400 block mt-1">${parseFloat(food.price).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(food)}
                        className="p-2 text-slate-500 hover:text-orange-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white">Your menu is empty</h3>
                <p className="text-xs text-slate-500 mb-4">Add your first dish to start selling!</p>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg"
                >
                  Create Dish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-card text-card-foreground border border-border w-full max-w-md rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-950 dark:text-slate-50">
                {editingFood ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button
                onClick={() => setShowFoodModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Margherita Pizza"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                    placeholder="9.99"
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={foodCategory}
                    onChange={(e) => setFoodCategory(e.target.value)}
                    placeholder="e.g. Starters, Dessert"
                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={foodDescription}
                  onChange={(e) => setFoodDescription(e.target.value)}
                  placeholder="Describe your dish..."
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Food Image URL
                </label>
                <input
                  type="text"
                  value={foodImage}
                  onChange={(e) => setFoodImage(e.target.value)}
                  placeholder="https://example.com/pizza.jpg"
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="foodIsVeg"
                  checked={foodIsVeg}
                  onChange={(e) => setFoodIsVeg(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="foodIsVeg" className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
                  Vegetarian Option
                </label>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="flex w-full justify-center items-center rounded-xl py-3 text-sm font-bold shadow-md btn-primary-gradient disabled:opacity-50 cursor-pointer"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Item'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
