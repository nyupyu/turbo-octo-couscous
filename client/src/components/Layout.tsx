import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Layout() {
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	return (
		<div className='min-h-screen bg-gray-100'>
			<nav className='bg-white shadow-lg'>
				<div className='max-w-7xl mx-auto px-4'>
					<div className='flex justify-between h-16'>
						<div className='flex space-x-8'>
							<Link to='/' className='flex items-center px-3 py-2 text-gray-700 hover:text-blue-600'>
								Dashboard
							</Link>
							<Link to='/bookings' className='flex items-center px-3 py-2 text-gray-700 hover:text-blue-600'>
								Moje Rezerwacje
							</Link>
							{user?.role === 'ADMIN' && (
								<>
									<Link to='/admin/rooms' className='flex items-center px-3 py-2 text-gray-700 hover:text-blue-600'>
										Zarządzanie Salami
									</Link>
									<Link to='/admin/logs' className='flex items-center px-3 py-2 text-gray-700 hover:text-blue-600'>
										Logi
									</Link>
								</>
							)}
						</div>
						<div className='flex items-center space-x-4'>
							<span className='text-gray-700'>
								{user?.email} ({user?.role})
							</span>
							<button onClick={handleLogout} className='btn btn-secondary'>
								Wyloguj
							</button>
						</div>
					</div>
				</div>
			</nav>
			<main className='max-w-7xl mx-auto py-6 px-4'>
				<Outlet />
			</main>
		</div>
	);
}
