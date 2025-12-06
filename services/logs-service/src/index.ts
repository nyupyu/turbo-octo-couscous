import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logRoutes from './routes/log.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'logs-service' });
});

// Routes
app.use('/api/logs', logRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
	logger.info(`Logs Service running on port ${PORT}`);
});
