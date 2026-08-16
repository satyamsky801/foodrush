import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './scripts/seed.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    // Auto-seed an empty database (first run / fresh in-memory DB).
    const restaurantCount = await Restaurant.countDocuments();
    if (restaurantCount === 0) {
      console.log('🌱 Database is empty — seeding sample data…');
      await seedDatabase({ verbose: false });
    }

    app.listen(PORT, () => {
      console.log(`🍕 FoodRush API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
