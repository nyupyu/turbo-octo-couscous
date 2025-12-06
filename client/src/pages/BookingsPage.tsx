import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Booking } from '../types';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function BookingsPage() {
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const { user } = useAuthStore();

	useEffect(() => {
		fetchBookings();
	}, []);

	const fetchBookings = async () => {
		try {
			const response = await api.get('/bookings');
			setBookings(response.data);
		} catch (err) {
			setError('Błąd pobierania rezerwacji');
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = async (id: string) => {
		if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) {
			return;
		}

		try {
			await api.delete(`/bookings/${id}`);
			setBookings(bookings.filter(b => b.id !== id));
		} catch (err: any) {
			alert(err.response?.data?.error || 'Błąd anulowania rezerwacji');
		}
	};

	const getStatusBadge = (status: string) => {
		const classes = {
			ACTIVE: 'bg-green-100 text-green-800',
			CANCELLED: 'bg-red-100 text-red-800',
			COMPLETED: 'bg-gray-100 text-gray-800',
		};

		const labels = {
			ACTIVE: 'Aktywna',
			CANCELLED: 'Anulowana',
			COMPLETED: 'Zakończona',
		};

		return <span className={`inline-block px-3 py-1 rounded-full text-sm ${classes[status as keyof typeof classes]}`}>{labels[status as keyof typeof labels]}</span>;
	};

	if (loading) {
		return <div className='text-center py-8'>Ładowanie...</div>;
	}

	return (
		<div>
			<h1 className='text-3xl font-bold mb-6'>Moje Rezerwacje</h1>

			{error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

			{bookings.length === 0 ? (
				<div className='card text-center py-8'>
					<p className='text-gray-600'>Brak rezerwacji</p>
				</div>
			) : (
				<div className='bg-white rounded-lg shadow overflow-hidden'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Sala</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Data rozpoczęcia</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Data zakończenia</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Cel</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Akcje</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{bookings.map(booking => (
								<tr key={booking.id}>
									<td className='px-6 py-4 whitespace-nowrap'>{booking.room?.name || 'N/A'}</td>
									<td className='px-6 py-4 whitespace-nowrap'>{format(new Date(booking.startTime), 'dd.MM.yyyy HH:mm')}</td>
									<td className='px-6 py-4 whitespace-nowrap'>{format(new Date(booking.endTime), 'dd.MM.yyyy HH:mm')}</td>
									<td className='px-6 py-4'>
										<div className='max-w-xs truncate'>{booking.purpose}</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>{getStatusBadge(booking.status)}</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm'>
										{booking.status === 'ACTIVE' && (booking.userId === user?.id || user?.role === 'ADMIN') && (
											<button onClick={() => handleCancel(booking.id)} className='text-red-600 hover:text-red-900'>
												Anuluj
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
