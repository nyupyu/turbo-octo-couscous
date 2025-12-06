import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
	email: z.string().email('Nieprawidłowy format email'),
	password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const [error, setError] = useState('');
	const { login } = useAuthStore();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginForm) => {
		try {
			setError('');
			await login(data.email, data.password);
			navigate('/');
		} catch (err: any) {
			setError(err.response?.data?.error || 'Błąd logowania');
		}
	};

	return (
		<div className='min-h-screen bg-gray-100 flex items-center justify-center'>
			<div className='card max-w-md w-full'>
				<h2 className='text-3xl font-bold text-center mb-6'>Logowanie</h2>

				{error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
						<input type='email' {...register('email')} className='input' placeholder='admin@example.com' />
						{errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Hasło</label>
						<input type='password' {...register('password')} className='input' placeholder='••••••••' />
						{errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password.message}</p>}
					</div>

					<button type='submit' disabled={isSubmitting} className='w-full btn btn-primary'>
						{isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
					</button>
				</form>

				<div className='mt-4 text-center'>
					<p className='text-sm text-gray-600'>
						Nie masz konta?{' '}
						<Link to='/register' className='text-blue-600 hover:underline'>
							Zarejestruj się
						</Link>
					</p>
				</div>

				<div className='mt-6 p-4 bg-blue-50 rounded'>
					<p className='text-sm font-semibold mb-2'>Konta testowe:</p>
					<p className='text-sm'>
						<strong>Admin:</strong> admin@example.com / Admin123!
					</p>
					<p className='text-sm'>
						<strong>User:</strong> user@example.com / User123!
					</p>
				</div>
			</div>
		</div>
	);
}
