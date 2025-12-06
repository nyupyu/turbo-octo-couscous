import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { logToService } from '../utils/logService';

const prisma = new PrismaClient();

// Validation schemas
const createRoomSchema = z.object({
	name: z.string().min(1, 'Room name is required'),
	capacity: z.number().int().positive('Capacity must be positive'),
	equipment: z.array(z.string()).default([]),
	isAvailable: z.boolean().default(true),
});

const updateRoomSchema = z.object({
	name: z.string().min(1).optional(),
	capacity: z.number().int().positive().optional(),
	equipment: z.array(z.string()).optional(),
	isAvailable: z.boolean().optional(),
});

// Get all rooms
export const getRooms = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const rooms = await prisma.room.findMany({
			orderBy: { name: 'asc' },
		});

		res.json(rooms);
	} catch (error) {
		next(error);
	}
};

// Get room by ID
export const getRoomById = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		const room = await prisma.room.findUnique({
			where: { id },
			include: {
				bookings: {
					where: {
						status: 'ACTIVE',
						endTime: {
							gte: new Date(),
						},
					},
					orderBy: { startTime: 'asc' },
				},
			},
		});

		if (!room) {
			return res.status(404).json({ error: 'Room not found' });
		}

		res.json(room);
	} catch (error) {
		next(error);
	}
};

// Create room (ADMIN only)
export const createRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const validatedData = createRoomSchema.parse(req.body);

		const room = await prisma.room.create({
			data: validatedData,
		});

		logger.info(`Room created: ${room.name}`, { userId: req.user?.userId });

		// Log to logs service
		await logToService({
			serviceName: 'crud-service',
			action: 'room.created',
			userId: req.user?.userId,
			details: { roomId: room.id, roomName: room.name },
			ipAddress: req.ip || 'unknown',
		});

		res.status(201).json(room);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Update room (ADMIN only)
export const updateRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const validatedData = updateRoomSchema.parse(req.body);

		const room = await prisma.room.update({
			where: { id },
			data: validatedData,
		});

		logger.info(`Room updated: ${room.name}`, { userId: req.user?.userId });

		// Log to logs service
		await logToService({
			serviceName: 'crud-service',
			action: 'room.updated',
			userId: req.user?.userId,
			details: { roomId: room.id, roomName: room.name },
			ipAddress: req.ip || 'unknown',
		});

		res.json(room);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Delete room (ADMIN only)
export const deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;

		const room = await prisma.room.delete({
			where: { id },
		});

		logger.info(`Room deleted: ${room.name}`, { userId: req.user?.userId });

		// Log to logs service
		await logToService({
			serviceName: 'crud-service',
			action: 'room.deleted',
			userId: req.user?.userId,
			details: { roomId: room.id, roomName: room.name },
			ipAddress: req.ip || 'unknown',
		});

		res.json({ message: 'Room deleted successfully', room });
	} catch (error) {
		next(error);
	}
};
