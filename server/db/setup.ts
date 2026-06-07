import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log("Connecting to the database...");
  const client = await pool.connect();
  try {
    console.log("Connected successfully. Reading schema.sql...");
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Initializing database schema (dropping and recreating tables)...");
    await client.query(schemaSql);
    console.log("Schema initialized successfully.");

    console.log("Seeding users...");
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const owner1PasswordHash = bcrypt.hashSync('owner123', 10);
    const owner2PasswordHash = bcrypt.hashSync('owner123', 10);
    const customer1PasswordHash = bcrypt.hashSync('customer123', 10);
    const customer2PasswordHash = bcrypt.hashSync('customer123', 10);

    const userInsertQuery = `
      INSERT INTO users (name, email, password, role) VALUES
      ('Platform Admin', 'admin@quickbite.com', $1, 'admin'),
      ('John Owner', 'owner1@quickbite.com', $2, 'restaurant'),
      ('Sarah Owner', 'owner2@quickbite.com', $3, 'restaurant'),
      ('Alice Customer', 'customer1@quickbite.com', $4, 'customer'),
      ('Bob Customer', 'customer2@quickbite.com', $5, 'customer')
      RETURNING id, name, email, role;
    `;
    const usersResult = await client.query(userInsertQuery, [
      adminPasswordHash,
      owner1PasswordHash,
      owner2PasswordHash,
      customer1PasswordHash,
      customer2PasswordHash
    ]);
    const seededUsers = usersResult.rows;
    console.log(`Seeded ${seededUsers.length} users.`);

    const owner1 = seededUsers.find(u => u.email === 'owner1@quickbite.com');
    const owner2 = seededUsers.find(u => u.email === 'owner2@quickbite.com');
    const customer1 = seededUsers.find(u => u.email === 'customer1@quickbite.com');
    const customer2 = seededUsers.find(u => u.email === 'customer2@quickbite.com');

    if (!owner1 || !owner2 || !customer1 || !customer2) {
      throw new Error("Failed to find seeded users for relations.");
    }

    console.log("Seeding restaurants...");
    const restaurantInsertQuery = `
      INSERT INTO restaurants (name, image, address, rating, owner_id, cuisine, distance, delivery_time, price_range, is_veg) VALUES
      ('Burger Haven', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', '123 Main St, Foodville', 4.5, $1, 'Burgers, Fast Food', 1.2, 20, '$$', false),
      ('Pizza Suprema', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', '456 Elm St, Foodville', 4.5, $1, 'Pizza, Italian', 2.8, 30, '$$', false),
      ('The Green Kitchen', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80', '789 Oak Ave, Foodville', 5.0, $2, 'Healthy, Vegetarian', 0.8, 15, '$', true),
      ('Sushi Zen', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80', '101 Pine St, Foodville', 4.0, $2, 'Japanese, Sushi', 4.5, 40, '$$$', false),
      ('Taco Fiesta', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80', '202 Maple Dr, Foodville', 4.0, $2, 'Mexican, Tacos', 3.1, 25, '$', false)
      RETURNING id, name;
    `;
    const restaurantsResult = await client.query(restaurantInsertQuery, [owner1.id, owner2.id]);
    const seededRestaurants = restaurantsResult.rows;
    console.log(`Seeded ${seededRestaurants.length} restaurants.`);

    const burgerHaven = seededRestaurants.find(r => r.name === 'Burger Haven');
    const pizzaSuprema = seededRestaurants.find(r => r.name === 'Pizza Suprema');
    const greenKitchen = seededRestaurants.find(r => r.name === 'The Green Kitchen');
    const sushiZen = seededRestaurants.find(r => r.name === 'Sushi Zen');
    const tacoFiesta = seededRestaurants.find(r => r.name === 'Taco Fiesta');

    if (!burgerHaven || !pizzaSuprema || !greenKitchen || !sushiZen || !tacoFiesta) {
      throw new Error("Failed to find seeded restaurants.");
    }

    console.log("Seeding foods...");
    const foodsInsertQuery = `
      INSERT INTO foods (restaurant_id, name, price, image, category, description, is_veg) VALUES
      -- Burger Haven
      ($1, 'Classic Cheeseburger', 9.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60', 'Burgers', 'Juicy beef patty with cheddar cheese, lettuce, tomato, onion, and our signature sauce.', false),
      ($1, 'Spicy Chicken Burger', 10.99, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=60', 'Burgers', 'Crispy chicken breast tossed in hot sauce, topped with spicy mayo, pickles, and lettuce.', false),
      ($1, 'Loaded Cheese Fries', 6.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60', 'Sides', 'Golden french fries smothered in cheddar cheese sauce and garnished with chives and jalapeños.', true),
      ($1, 'Crispy Onion Rings', 5.99, 'https://images.unsplash.com/photo-1639024471283-2da7b3c6a26b?w=500&auto=format&fit=crop&q=60', 'Sides', 'Crispy, golden-fried beer-battered onion rings served with ranch dip.', true),
      ($1, 'Chocolate Lava Milkshake', 4.99, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60', 'Beverages', 'Rich chocolate shake lined with hot fudge, topped with whipped cream and chocolate chips.', true),
      
      -- Pizza Suprema
      ($2, 'Margherita Pizza', 12.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60', 'Pizza', 'Classic thin-crust pizza topped with rich tomato sauce, fresh mozzarella, fresh basil, and extra virgin olive oil.', true),
      ($2, 'Pepperoni Overload Pizza', 15.99, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60', 'Pizza', 'Perfectly baked crust loaded with double pepperoni and high-quality mozzarella cheese.', false),
      ($2, 'Garlic Herb Breadsticks', 5.99, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=60', 'Sides', 'Warm, freshly-baked breadsticks brushed with garlic butter and Italian herbs, served with marinara sauce.', true),
      ($2, 'Classic Caesar Salad', 8.99, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60', 'Salads', 'Crisp romaine lettuce, house-made sourdough croutons, parmesan cheese, and creamy Caesar dressing.', true),
      ($2, 'Chilled Coca-Cola', 2.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60', 'Beverages', 'Chilled 500ml can of original Coca-Cola.', true),
      
      -- The Green Kitchen
      ($3, 'Avocado Quinoa Salad', 11.99, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60', 'Bowls', 'Fresh avocado, nutrient-rich quinoa, spinach, organic cherry tomatoes, cucumbers, and zesty lemon dressing.', true),
      ($3, 'Mediterranean Hummus Wrap', 9.99, 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=500&auto=format&fit=crop&q=60', 'Wraps', 'Whole wheat tortilla stuffed with house-made hummus, grilled Mediterranean veggies, spinach, and feta.', true),
      ($3, 'Baked Sweet Potato Fries', 6.49, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&auto=format&fit=crop&q=60', 'Sides', 'Oven-baked sweet potato wedges seasoned with sea salt and served with vegan garlic aioli.', true),
      ($3, 'Organic Green Glow Juice', 5.99, 'https://images.unsplash.com/photo-1610970881699-44a5587caaec?w=500&auto=format&fit=crop&q=60', 'Beverages', 'Freshly cold-pressed kale, spinach, celery, green apple, cucumber, lemon, and ginger.', true),
      
      -- Sushi Zen
      ($4, 'Signature California Roll', 14.99, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60', 'Sushi', 'Crab meat, creamy avocado, crisp cucumber, rolled with sesame seeds and flying fish roe.', false),
      ($4, 'Premium Salmon Nigiri', 16.99, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop&q=60', 'Sushi', 'Five pieces of fresh hand-sliced salmon draped over premium seasoned sushi rice.', false),
      ($4, 'Crunchy Veggie Tempura Roll', 11.99, 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&auto=format&fit=crop&q=60', 'Sushi', 'Crispy sweet potato and asparagus tempura wrapped inside rice and seaweed, drizzled with sweet unagi sauce.', true),
      ($4, 'Classic Miso Soup', 4.99, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop&q=60', 'Sides', 'Traditional hot Japanese soy broth filled with soft tofu cubes, green onions, and wakame seaweed.', true),
      
      -- Taco Fiesta
      ($5, 'Traditional Beef Birria Tacos', 11.99, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=60', 'Tacos', 'Three crispy folded corn tortillas stuffed with slow-cooked braised beef, melted cheese, onions, and cilantro, served with consume broth.', false),
      ($5, 'Chipotle Chicken Quesadilla', 10.99, 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500&auto=format&fit=crop&q=60', 'Quesadillas', 'Large grilled flour tortilla filled with tender spiced chipotle chicken strips and a rich blend of Mexican cheeses.', false),
      ($5, 'Loaded Veggie Nachos Deluxe', 8.99, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60', 'Starters', 'Crunchy corn tortilla chips piled high with black beans, warm cheese sauce, fresh guacamole, sour cream, and pico de gallo.', true),
      ($5, 'Churros with Warm Caramel', 5.99, 'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=500&auto=format&fit=crop&q=60', 'Desserts', 'Crispy fried Mexican pastries rolled in fragrant cinnamon sugar, accompanied by hot dulce de leche dip.', true)
    ;
    `;
    await client.query(foodsInsertQuery, [
      burgerHaven.id,
      pizzaSuprema.id,
      greenKitchen.id,
      sushiZen.id,
      tacoFiesta.id
    ]);
    console.log("Seeded menu items successfully.");

    console.log("Seeding reviews...");
    const reviewsInsertQuery = `
      INSERT INTO reviews (user_id, restaurant_id, rating, comment) VALUES
      ($1, $5, 5, 'Absolutely spectacular! Fresh ingredients, highly recommend the wrap.'),
      ($2, $5, 5, 'The green juice is so refreshing and detoxifying. Extremely clean place!'),
      ($1, $6, 4, 'Really fresh salmon nigiri. The California rolls were average but solid.'),
      ($2, $7, 5, 'The Birria tacos are out of this world! Dip them in the broth, delicious.'),
      ($1, $7, 3, 'Tacos were very tasty but delivery took longer than expected.'),
      ($2, $3, 5, 'Perfect burger! Bun is soft, patty is juicy and fresh.'),
      ($1, $3, 4, 'Very good classic burger. Fries are delicious too!'),
      ($2, $4, 4, 'Excellent pizza dough. Thin crust, very authentic!'),
      ($1, $4, 5, 'Best Pepperoni Pizza in town! Fast delivery.')
    ;
    `;
    await client.query(reviewsInsertQuery, [
      customer1.id,
      customer2.id,
      burgerHaven.id,
      pizzaSuprema.id,
      greenKitchen.id,
      sushiZen.id,
      tacoFiesta.id
    ]);
    console.log("Seeded reviews successfully.");

    // Update restaurant ratings to match seeded reviews
    console.log("Updating restaurant average ratings in database...");
    const updateRatingsQuery = `
      UPDATE restaurants r
      SET rating = COALESCE(
        (SELECT ROUND(AVG(rating), 1) FROM reviews re WHERE re.restaurant_id = r.id),
        4.0
      );
    `;
    await client.query(updateRatingsQuery);
    console.log("Restaurant average ratings computed and saved.");

    console.log("Database successfully seeded!");

  } catch (error) {
    console.error("Error running database setup/seeding:", error);
  } finally {
    client.release();
    await pool.end();
    console.log("Database connection pool closed.");
  }
}

main();
