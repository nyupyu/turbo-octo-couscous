import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const CRUD_SERVICE_URL = process.env.CRUD_SERVICE_URL || 'http://crud-service:3002';
const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || 'http://logs-service:3003';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS configuration
app.use(
	cors({
		origin: [CLIENT_URL, 'http://localhost:5173'],
		credentials: true,
	}),
);

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
});

app.use('/api', limiter);

// Request logging (before body parsing)
app.use(requestLogger);

// Health check (before proxying)
app.get('/health', (req, res) => {
	res.json({ status: 'ok', service: 'api-gateway' });
});

// Proxy configuration
const proxyOptions = {
	changeOrigin: true,
	timeout: 30000,
	proxyTimeout: 30000,
	onError: (err: any, req: any, res: any) => {
		logger.error('Proxy error:', err);
		res.status(502).json({
			error: 'Bad Gateway',
			message: 'Service temporarily unavailable',
		});
	},
	onProxyReq: (proxyReq: any, req: any) => {
		// Forward JWT token
		if (req.headers.authorization) {
			proxyReq.setHeader('Authorization', req.headers.authorization);
		}
		// Forward IP address
		if (req.ip) {
			proxyReq.setHeader('X-Forwarded-For', req.ip);
		}
	},
};

// Auth Service routes
app.use(
	'/api/auth',
	createProxyMiddleware({
		target: AUTH_SERVICE_URL,
		pathRewrite: { '^/api/auth': '/api/auth' },
		...proxyOptions,
	}),
);

// CRUD Service routes - Rooms
app.use(
	'/api/rooms',
	createProxyMiddleware({
		target: CRUD_SERVICE_URL,
		pathRewrite: { '^/api/rooms': '/api/rooms' },
		...proxyOptions,
	}),
);

// CRUD Service routes - Bookings
app.use(
	'/api/bookings',
	createProxyMiddleware({
		target: CRUD_SERVICE_URL,
		pathRewrite: { '^/api/bookings': '/api/bookings' },
		...proxyOptions,
	}),
);

// Logs Service routes
app.use(
	'/api/logs',
	createProxyMiddleware({
		target: LOGS_SERVICE_URL,
		pathRewrite: { '^/api/logs': '/api/logs' },
		...proxyOptions,
	}),
);

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: 'Not Found',
		message: `Route ${req.method} ${req.path} not found`,
	});
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
	logger.info(`API Gateway running on port ${PORT}`);
	logger.info(`Routing to services:`);
	logger.info(`  - Auth: ${AUTH_SERVICE_URL}`);
	logger.info(`  - CRUD: ${CRUD_SERVICE_URL}`);
	logger.info(`  - Logs: ${LOGS_SERVICE_URL}`);
});
