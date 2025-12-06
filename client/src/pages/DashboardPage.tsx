import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import { Room } from '../types';
import api from '../services/api';

const bookingSchema = z.object({
	roomId: z.string().min(1, 'Wybierz salę'),
	purpose: z.string().min(1, 'Podaj cel rezerwacji'),
});

type BookingForm = z.infer<typeof bookingSchema>;

export default function DashboardPage() {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [startTime, setStartTime] = useState<Date>(new Date());
	const [endTime, setEndTime] = useState<Date>(new Date());

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<BookingForm>({
		resolver: zodResolver(bookingSchema),
	});

	useEffect(() => {
		fetchRooms();
	}, []);

	const fetchRooms = async () => {
		try {
			const response = await api.get('/rooms');
			setRooms(response.data);
		} catch (err) {
			setError('Błąd pobierania sal');
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: BookingForm) => {
		try {
			setError('');
			setSuccess('');

			if (startTime >= endTime) {
				setError('Czas zakończenia musi być po czasie rozpoczęcia');
				return;
			}

			if (startTime < new Date()) {
				setError('Nie można rezerwować w przeszłości');
				return;
			}

			await api.post('/bookings', {
				...data,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
			});

			setSuccess('Rezerwacja została utworzona pomyślnie');
			setShowModal(false);
			reset();
			setTimeout(() => setSuccess(''), 3000);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Błąd tworzenia rezerwacji');
		}
	};

	if (loading) {
		return <div className='text-center py-8'>Ładowanie...</div>;
	}

	return (
		<div>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>Dostępne Sale Konferencyjne</h1>
				<button onClick={() => setShowModal(true)} className='btn btn-primary'>
					Nowa Rezerwacja
				</button>
			</div>

			{error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

			{success && <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>{success}</div>}

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{rooms.map(room => (
					<div key={room.id} className='card'>
						<h3 className='text-xl font-bold mb-2'>{room.name}</h3>
						<p className='text-gray-600 mb-2'>Pojemność: {room.capacity} osób</p>
						<div className='mb-2'>
							<p className='text-sm font-semibold text-gray-700'>Wyposażenie:</p>
							<ul className='list-disc list-inside text-sm text-gray-600'>
								{room.equipment.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>
						<div className='mt-4'>
							{room.isAvailable ? (
								<span className='inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm'>Dostępna</span>
							) : (
								<span className='inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm'>Niedostępna</span>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Booking Modal */}
			{showModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full'>
						<h2 className='text-2xl font-bold mb-4'>Nowa Rezerwacja</h2>

						<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Sala</label>
								<select {...register('roomId')} className='input'>
									<option value=''>Wybierz salę</option>
									{rooms
										.filter(r => r.isAvailable)
										.map(room => (
											<option key={room.id} value={room.id}>
												{room.name} ({room.capacity} osób)
											</option>
										))}
								</select>
								{errors.roomId && <p className='text-red-500 text-sm mt-1'>{errors.roomId.message}</p>}
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Data i czas rozpoczęcia</label>
								<DatePicker selected={startTime} onChange={(date: Date) => setStartTime(date)} showTimeSelect dateFormat='Pp' className='input' minDate={new Date()} />
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Data i czas zakończenia</label>
								<DatePicker selected={endTime} onChange={(date: Date) => setEndTime(date)} showTimeSelect dateFormat='Pp' className='input' minDate={startTime} />
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Cel rezerwacji</label>
								<textarea {...register('purpose')} className='input' rows={3} placeholder='Spotkanie zespołu, prezentacja...' />
								{errors.purpose && <p className='text-red-500 text-sm mt-1'>{errors.purpose.message}</p>}
							</div>

							<div className='flex space-x-2'>
								<button type='submit' disabled={isSubmitting} className='flex-1 btn btn-primary'>
									{isSubmitting ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button
									type='button'
									onClick={() => {
										setShowModal(false);
										reset();
										setError('');
									}}
									className='flex-1 btn btn-secondary'
								>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
