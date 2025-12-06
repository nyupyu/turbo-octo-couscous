import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const registerSchema = z
	.object({
		email: z.string().email('Nieprawidłowy format email'),
		password: z
			.string()
			.min(8, 'Hasło musi mieć minimum 8 znaków')
			.regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
			.regex(/[a-z]/, 'Hasło musi zawierać małą literę')
			.regex(/[0-9]/, 'Hasło musi zawierać cyfrę')
			.regex(/[^A-Za-z0-9]/, 'Hasło musi zawierać znak specjalny'),
		confirmPassword: z.string(),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: 'Hasła nie pasują do siebie',
		path: ['confirmPassword'],
	});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const { register: registerUser } = useAuthStore();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterForm) => {
		try {
			setError('');
			await registerUser(data.email, data.password);
			setSuccess(true);
			setTimeout(() => navigate('/login'), 2000);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Błąd rejestracji');
		}
	};

	return (
		<div className='min-h-screen bg-gray-100 flex items-center justify-center'>
			<div className='card max-w-md w-full'>
				<h2 className='text-3xl font-bold text-center mb-6'>Rejestracja</h2>

				{error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

				{success && <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>Rejestracja udana! Przekierowanie do logowania...</div>}

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
						<input type='email' {...register('email')} className='input' placeholder='email@example.com' />
						{errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email.message}</p>}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Hasło</label>
						<input type='password' {...register('password')} className='input' placeholder='••••••••' />
						{errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password.message}</p>}
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Potwierdź hasło</label>
						<input type='password' {...register('confirmPassword')} className='input' placeholder='••••••••' />
						{errors.confirmPassword && <p className='text-red-500 text-sm mt-1'>{errors.confirmPassword.message}</p>}
					</div>

					<button type='submit' disabled={isSubmitting} className='w-full btn btn-primary'>
						{isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
					</button>
				</form>

				<div className='mt-4 text-center'>
					<p className='text-sm text-gray-600'>
						Masz już konto?{' '}
						<Link to='/login' className='text-blue-600 hover:underline'>
							Zaloguj się
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
