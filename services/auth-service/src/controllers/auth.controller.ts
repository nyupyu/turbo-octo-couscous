import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { logToService } from '../utils/logService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validation schemas
const registerSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number')
		.regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
	role: z.enum(['USER', 'ADMIN']).optional(),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

const verifyTokenSchema = z.object({
	token: z.string().min(1, 'Token is required'),
});

// Register
export const register = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const validatedData = registerSchema.parse(req.body);
		const { email, password, role = 'USER' } = validatedData;

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return res.status(400).json({ error: 'User already exists' });
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 12);

		// Create user
		const user = await prisma.user.create({
			data: {
				email,
				passwordHash,
				role,
			},
			select: {
				id: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		logger.info(`User registered: ${email}`);

		// Log to logs service
		await logToService({
			serviceName: 'auth-service',
			action: 'user.registered',
			userId: user.id,
			details: { email },
			ipAddress: req.ip || 'unknown',
		});

		res.status(201).json({
			message: 'User registered successfully',
			user,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const validatedData = loginSchema.parse(req.body);
		const { email, password } = validatedData;

		// Find user
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.passwordHash);

		if (!isValidPassword) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Generate tokens
		const accessToken = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
			},
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN } as SignOptions,
		);

		const refreshToken = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
			},
			JWT_SECRET,
			{ expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions,
		);

		logger.info(`User logged in: ${email}`);

		// Log to logs service
		await logToService({
			serviceName: 'auth-service',
			action: 'user.logged_in',
			userId: user.id,
			details: { email },
			ipAddress: req.ip || 'unknown',
		});

		res.json({
			message: 'Login successful',
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
			},
			accessToken,
			refreshToken,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Verify Token
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const validatedData = verifyTokenSchema.parse(req.body);
		const { token } = validatedData;

		const decoded = jwt.verify(token, JWT_SECRET) as {
			userId: string;
			email: string;
			role: string;
		};

		// Check if user still exists
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				email: true,
				role: true,
			},
		});

		if (!user) {
			return res.status(401).json({ error: 'User not found' });
		}

		// Log verification
		await logToService({
			serviceName: 'auth-service',
			action: 'auth.token_verified',
			userId: user.id,
			details: { email: user.email },
			ipAddress: req.ip || 'unknown',
		});

		res.json({
			valid: true,
			user: {
				userId: user.id,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({ error: 'Invalid token' });
		}
		if (error instanceof jwt.TokenExpiredError) {
			return res.status(401).json({ error: 'Token expired' });
		}
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({ error: 'Refresh token is required' });
		}

		const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
			userId: string;
			email: string;
			role: string;
		};

		// Check if user still exists
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
		});

		if (!user) {
			return res.status(401).json({ error: 'User not found' });
		}

		// Generate new access token
		const accessToken = jwt.sign(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
			},
			JWT_SECRET,
			{ expiresIn: JWT_EXPIRES_IN } as SignOptions,
		);

		res.json({
			accessToken,
		});
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({ error: 'Invalid refresh token' });
		}
		if (error instanceof jwt.TokenExpiredError) {
			return res.status(401).json({ error: 'Refresh token expired' });
		}
		next(error);
	}
};
