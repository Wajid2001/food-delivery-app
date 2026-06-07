import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes mapping
app.use('/auth', authRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/foods', foodRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

// Homepage endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>QuickBite API Server</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 40px;
            background: #fafafa;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }
          h1 {
            color: #ff4757;
            margin-top: 0;
          }
          .status {
            display: inline-block;
            background: #2ed573;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: bold;
            margin-bottom: 20px;
          }
          code {
            background: #f1f2f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: Courier, monospace;
          }
          a {
            color: #3742fa;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>QuickBite API Server</h1>
          <div class="status">Online</div>
          <p>The server is running smoothly on port 5001.</p>
          <p>Ready to serve requests for the food delivery client application.</p>
          <h3>Useful Endpoints:</h3>
          <ul>
            <li>Health check: <code><a href="/health">/health</a></code></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'QuickBite API Server is running smoothly' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});