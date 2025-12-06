import { Router } from 'express';
import { register, login, verifyToken, refreshToken } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', verifyToken);
router.post('/refresh-token', refreshToken);

export default router;
