export interface User {
	id: string;
	email: string;
	role: 'USER' | 'ADMIN';
}

export interface Room {
	id: string;
	name: string;
	capacity: number;
	equipment: string[];
	isAvailable: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Booking {
	id: string;
	roomId: string;
	userId: string;
	startTime: string;
	endTime: string;
	purpose: string;
	status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
	createdAt: string;
	updatedAt: string;
	room?: Room;
}

export interface Log {
	id: string;
	timestamp: string;
	serviceName: string;
	action: string;
	userId?: string;
	details?: any;
	ipAddress: string;
	createdAt: string;
}

export interface LogStats {
	total: number;
	byService: Array<{ serviceName: string; count: number }>;
	byAction: Array<{ action: string; count: number }>;
	topUsers: Array<{ userId: string; count: number }>;
}
