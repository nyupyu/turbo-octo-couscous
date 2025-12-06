import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
	logger.error(`Error: ${error.message}`, { stack: error.stack });

	res.status(500).json({
		error: 'Internal server error',
		message: process.env.NODE_ENV === 'development' ? error.message : undefined,
	});
};
