import { Router } from 'express';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticate, getRooms);
router.get('/:id', authenticate, getRoomById);

// Admin only routes
router.post('/', authenticate, requireRole('ADMIN'), createRoom);
router.put('/:id', authenticate, requireRole('ADMIN'), updateRoom);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteRoom);

export default router;
