import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'auth-service' });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
	logger.info(`Auth Service running on port ${PORT}`);
});
