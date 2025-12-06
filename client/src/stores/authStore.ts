import { create } from 'zustand';
import { User } from '../types';
import api from '../services/api';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => void;
	initialize: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
	user: null,
	isAuthenticated: false,

	login: async (email: string, password: string) => {
		const response = await api.post('/auth/login', { email, password });
		const { user, accessToken, refreshToken } = response.data;
		localStorage.setItem('accessToken', accessToken);
		localStorage.setItem('refreshToken', refreshToken);
		set({ user, isAuthenticated: true });
	},

	register: async (email: string, password: string) => {
		await api.post('/auth/register', { email, password });
	},

	logout: () => {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		set({ user: null, isAuthenticated: false });
	},

	initialize: async () => {
		const token = localStorage.getItem('accessToken');
		if (token) {
			try {
				const response = await api.post('/auth/verify-token', { token });
				if (response.data.valid) {
					set({ user: response.data.user, isAuthenticated: true });
				}
			} catch (error) {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			}
		}
	},
}));

// Initialize auth state on app load
useAuthStore.getState().initialize();
