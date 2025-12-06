import axios from 'axios';
import { logger } from './logger';

const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || 'http://logs-service:3003';

interface LogData {
	serviceName: string;
	action: string;
	userId?: string;
	details?: Record<string, any>;
	ipAddress: string;
}

export const logToService = async (data: LogData): Promise<void> => {
	try {
		await axios.post(`${LOGS_SERVICE_URL}/api/logs`, data, {
			timeout: 5000,
		});
	} catch (error) {
		logger.error('Failed to send log to logs service', { error });
	}
};
