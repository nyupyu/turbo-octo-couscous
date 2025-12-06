import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { logToService } from '../utils/logService';

const prisma = new PrismaClient();

// Validation schemas
const createBookingSchema = z.object({
	roomId: z.string().uuid('Invalid room ID'),
	startTime: z.string().datetime('Invalid start time'),
	endTime: z.string().datetime('Invalid end time'),
	purpose: z.string().min(1, 'Purpose is required'),
});

const updateBookingSchema = z.object({
	startTime: z.string().datetime().optional(),
	endTime: z.string().datetime().optional(),
	purpose: z.string().min(1).optional(),
	status: z.enum(['ACTIVE', 'CANCELLED', 'COMPLETED']).optional(),
});

// Helper function to check booking conflicts
async function hasConflict(roomId: string, startTime: Date, endTime: Date, excludeBookingId?: string): Promise<boolean> {
	const conflicts = await prisma.booking.findMany({
		where: {
			roomId,
			status: 'ACTIVE',
			id: excludeBookingId ? { not: excludeBookingId } : undefined,
			OR: [
				{
					// New booking starts during existing booking
					AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
				},
				{
					// New booking ends during existing booking
					AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
				},
				{
					// New booking contains existing booking
					AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
				},
			],
		},
	});

	return conflicts.length > 0;
}

// Get bookings (user sees only their bookings, admin sees all)
export const getBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const userId = req.user?.userId;
		const isAdmin = req.user?.role === 'ADMIN';

		const bookings = await prisma.booking.findMany({
			where: isAdmin ? {} : { userId },
			include: {
				room: true,
			},
			orderBy: { startTime: 'desc' },
		});

		res.json(bookings);
	} catch (error) {
		next(error);
	}
};

// Get booking by ID
export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const userId = req.user?.userId;
		const isAdmin = req.user?.role === 'ADMIN';

		const booking = await prisma.booking.findUnique({
			where: { id },
			include: {
				room: true,
			},
		});

		if (!booking) {
			return res.status(404).json({ error: 'Booking not found' });
		}

		// Check ownership
		if (!isAdmin && booking.userId !== userId) {
			return res.status(403).json({ error: 'Access denied' });
		}

		res.json(booking);
	} catch (error) {
		next(error);
	}
};

// Create booking
export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const validatedData = createBookingSchema.parse(req.body);
		const { roomId, startTime, endTime, purpose } = validatedData;
		const userId = req.user?.userId!;

		const start = new Date(startTime);
		const end = new Date(endTime);

		// Validate times
		if (start >= end) {
			return res.status(400).json({ error: 'End time must be after start time' });
		}

		if (start < new Date()) {
			return res.status(400).json({ error: 'Cannot book in the past' });
		}

		// Check if room exists and is available
		const room = await prisma.room.findUnique({
			where: { id: roomId },
		});

		if (!room) {
			return res.status(404).json({ error: 'Room not found' });
		}

		if (!room.isAvailable) {
			return res.status(400).json({ error: 'Room is not available' });
		}

		// Check for conflicts
		const conflict = await hasConflict(roomId, start, end);

		if (conflict) {
			return res.status(409).json({
				error: 'Time slot is already booked',
			});
		}

		// Create booking
		const booking = await prisma.booking.create({
			data: {
				roomId,
				userId,
				startTime: start,
				endTime: end,
				purpose,
			},
			include: {
				room: true,
			},
		});

		logger.info(`Booking created: ${booking.id}`, { userId });

		// Log to logs service
		await logToService({
			serviceName: 'crud-service',
			action: 'booking.created',
			userId,
			details: {
				bookingId: booking.id,
				roomId,
				roomName: room.name,
				startTime,
				endTime,
			},
			ipAddress: req.ip || 'unknown',
		});

		res.status(201).json(booking);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Update booking
export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const validatedData = updateBookingSchema.parse(req.body);
		const userId = req.user?.userId!;
		const isAdmin = req.user?.role === 'ADMIN';

		// Get existing booking
		const existingBooking = await prisma.booking.findUnique({
			where: { id },
		});

		if (!existingBooking) {
			return res.status(404).json({ error: 'Booking not found' });
		}

		// Check ownership
		if (!isAdmin && existingBooking.userId !== userId) {
			return res.status(403).json({ error: 'Access denied' });
		}

		// Validate time changes
		if (validatedData.startTime || validatedData.endTime) {
			const start = validatedData.startTime ? new Date(validatedData.startTime) : existingBooking.startTime;
			const end = validatedData.endTime ? new Date(validatedData.endTime) : existingBooking.endTime;

			if (start >= end) {
				return res.status(400).json({ error: 'End time must be after start time' });
			}

			// Check for conflicts
			const conflict = await hasConflict(existingBooking.roomId, start, end, id);

			if (conflict) {
				return res.status(409).json({
					error: 'Time slot is already booked',
				});
			}
		}

		// Update booking
		const booking = await prisma.booking.update({
			where: { id },
			data: validatedData,
			include: {
				room: true,
			},
		});

		logger.info(`Booking updated: ${booking.id}`, { userId });

		// Log to logs service
		await logToService({
			serviceName: 'crud-service',
			action: 'booking.updated',
			userId,
			details: {
				bookingId: booking.id,
				changes: validatedData,
			},
			ipAddress: req.ip || 'unknown',
		});

		res.json(booking);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ error: error.errors[0].message });
		}
		next(error);
	}
};

// Delete booking (cancel)
export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const userId = req.user?.userId!;
		const isAdmin = req.user?.role === 'ADMIN';

		// Get existing booking
		const existingBooking = await prisma.booking.findUnique({
			where: { id },
		});

		if (!existingBooking) {
			return res.status(404).json({ error: 'Booking not found' });
		}

		// Check ownership
		if (!isAdmin && existingBooking.userId !== userId) {
			return res.status(403).json({ error: 'Access denied' });
		}

		// Update status to cancelled instead of deleting
		const booking = await prisma.booking.update({
			where: { id },
			data: { status: 'CANCELLED' },
			include: {
				room: true,
			},
		});

		logger.info(`Booking cancelled: ${booking.id}`, { userId });

		// Log to logs service
		await logToService({
			serviceName: 'crud-service',
			action: 'booking.deleted',
			userId,
			details: {
				bookingId: booking.id,
				roomId: booking.roomId,
			},
			ipAddress: req.ip || 'unknown',
		});

		res.json({ message: 'Booking cancelled successfully', booking });
	} catch (error) {
		next(error);
	}
};
