import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const createLogSchema = z.object({
	serviceName: z.string().min(1, 'Service name is required'),
	action: z.string().min(1, 'Action is required'),
	userId: z.string().optional(),
	details: z.record(z.any()).optional(),
	ipAddress: z.string().default('unknown'),
});

const getLogsSchema = z.object({
	serviceName: z.string().optional(),
	action: z.string().optional(),
	userId: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	page: z
		.string()
		.optional()
		.transform(val => (val ? parseInt(val) : 1)),
	limit: z
		.string()
		.optional()
		.transform(val => (val ? parseInt(val) : 50)),
});

// Create log entry
export const createLog = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const validatedData = createLogSchema.parse(req.body);

		const log = await prisma.log.create({
			data: {
				...validatedData,
				details: validatedData.details ? (validatedData.details as Prisma.InputJsonValue) : Prisma.JsonNull,
			},
		});

		logger.info(`Log created: ${validatedData.action}`, {
			serviceName: validatedData.serviceName,
		});

		res.status(201).json(log);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Get logs with filtering
export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const validatedQuery = getLogsSchema.parse(req.query);
		const { serviceName, action, userId, startDate, endDate, page = 1, limit = 50 } = validatedQuery;

		// Build filter
		const where: Prisma.LogWhereInput = {};

		if (serviceName) {
			where.serviceName = serviceName;
		}

		if (action) {
			where.action = action;
		}

		if (userId) {
			where.userId = userId;
		}

		if (startDate || endDate) {
			where.timestamp = {};
			if (startDate) {
				where.timestamp.gte = new Date(startDate);
			}
			if (endDate) {
				where.timestamp.lte = new Date(endDate);
			}
		}

		// Get total count
		const total = await prisma.log.count({ where });

		// Get logs
		const logs = await prisma.log.findMany({
			where,
			orderBy: { timestamp: 'desc' },
			skip: (page - 1) * limit,
			take: limit,
		});

		res.json({
			logs,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Get statistics
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { startDate, endDate } = req.query;

		const where: Prisma.LogWhereInput = {};

		if (startDate || endDate) {
			where.timestamp = {};
			if (startDate) {
				where.timestamp.gte = new Date(startDate as string);
			}
			if (endDate) {
				where.timestamp.lte = new Date(endDate as string);
			}
		}

		// Count by service
		const byService = await prisma.log.groupBy({
			by: ['serviceName'],
			where,
			_count: {
				serviceName: true,
			},
			orderBy: {
				_count: {
					serviceName: 'desc',
				},
			},
		});

		// Count by action
		const byAction = await prisma.log.groupBy({
			by: ['action'],
			where,
			_count: {
				action: true,
			},
			orderBy: {
				_count: {
					action: 'desc',
				},
			},
		});

		// Total logs
		const total = await prisma.log.count({ where });

		// Most active users
		const byUser = await prisma.log.groupBy({
			by: ['userId'],
			where: {
				...where,
				userId: { not: null },
			},
			_count: {
				userId: true,
			},
			orderBy: {
				_count: {
					userId: 'desc',
				},
			},
			take: 10,
		});

		res.json({
			total,
			byService: byService.map(item => ({
				serviceName: item.serviceName,
				count: item._count.serviceName,
			})),
			byAction: byAction.map(item => ({
				action: item.action,
				count: item._count.action,
			})),
			topUsers: byUser.map(item => ({
				userId: item.userId,
				count: item._count.userId,
			})),
		});
	} catch (error) {
		next(error);
	}
};
