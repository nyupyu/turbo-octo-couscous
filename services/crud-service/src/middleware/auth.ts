import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

export interface AuthRequest extends Request {
	user?: {
		userId: string;
		email: string;
		role: string;
	};
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'No token provided' });
		}

		const token = authHeader.substring(7);

		// Verify token with auth service
		const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify-token`, { token }, { timeout: 5000 });

		if (response.data.valid) {
			req.user = response.data.user;
			next();
		} else {
			res.status(401).json({ error: 'Invalid token' });
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 401) {
				return res.status(401).json({ error: 'Invalid or expired token' });
			}
		}
		res.status(500).json({ error: 'Authentication failed' });
	}
};

export const requireRole = (role: string) => {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({ error: 'Not authenticated' });
		}

		if (req.user.role !== role && req.user.role !== 'ADMIN') {
			return res.status(403).json({ error: 'Insufficient permissions' });
		}

		next();
	};
};
