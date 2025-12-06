import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Room } from '../types';
import api from '../services/api';

const roomSchema = z.object({
	name: z.string().min(1, 'Nazwa jest wymagana'),
	capacity: z.number().int().positive('Pojemność musi być liczbą dodatnią'),
	equipment: z.string(),
	isAvailable: z.boolean(),
});

type RoomForm = z.infer<typeof roomSchema>;

export default function RoomsAdminPage() {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [editingRoom, setEditingRoom] = useState<Room | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
		setValue,
	} = useForm<RoomForm>({
		resolver: zodResolver(roomSchema),
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

	const openCreateModal = () => {
		setEditingRoom(null);
		reset({
			name: '',
			capacity: 10,
			equipment: '',
			isAvailable: true,
		});
		setShowModal(true);
	};

	const openEditModal = (room: Room) => {
		setEditingRoom(room);
		setValue('name', room.name);
		setValue('capacity', room.capacity);
		setValue('equipment', room.equipment.join(', '));
		setValue('isAvailable', room.isAvailable);
		setShowModal(true);
	};

	const onSubmit = async (data: RoomForm) => {
		try {
			setError('');
			setSuccess('');

			const equipmentArray = data.equipment
				.split(',')
				.map(item => item.trim())
				.filter(item => item);

			const roomData = {
				name: data.name,
				capacity: Number(data.capacity),
				equipment: equipmentArray,
				isAvailable: data.isAvailable,
			};

			if (editingRoom) {
				await api.put(`/rooms/${editingRoom.id}`, roomData);
				setSuccess('Sala zaktualizowana pomyślnie');
			} else {
				await api.post('/rooms', roomData);
				setSuccess('Sala utworzona pomyślnie');
			}

			setShowModal(false);
			reset();
			fetchRooms();
			setTimeout(() => setSuccess(''), 3000);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Błąd zapisu sali');
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Czy na pewno chcesz usunąć tę salę?')) {
			return;
		}

		try {
			await api.delete(`/rooms/${id}`);
			setRooms(rooms.filter(r => r.id !== id));
			setSuccess('Sala usunięta pomyślnie');
			setTimeout(() => setSuccess(''), 3000);
		} catch (err: any) {
			setError(err.response?.data?.error || 'Błąd usuwania sali');
		}
	};

	if (loading) {
		return <div className='text-center py-8'>Ładowanie...</div>;
	}

	return (
		<div>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>Zarządzanie Salami</h1>
				<button onClick={openCreateModal} className='btn btn-primary'>
					Dodaj Salę
				</button>
			</div>

			{error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

			{success && <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>{success}</div>}

			<div className='bg-white rounded-lg shadow overflow-hidden'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Nazwa</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Pojemność</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Wyposażenie</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
							<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Akcje</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{rooms.map(room => (
							<tr key={room.id}>
								<td className='px-6 py-4 whitespace-nowrap font-medium'>{room.name}</td>
								<td className='px-6 py-4 whitespace-nowrap'>{room.capacity} osób</td>
								<td className='px-6 py-4'>{room.equipment.join(', ') || 'Brak'}</td>
								<td className='px-6 py-4 whitespace-nowrap'>
									{room.isAvailable ? (
										<span className='inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm'>Dostępna</span>
									) : (
										<span className='inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm'>Niedostępna</span>
									)}
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm space-x-2'>
									<button onClick={() => openEditModal(room)} className='text-blue-600 hover:text-blue-900'>
										Edytuj
									</button>
									<button onClick={() => handleDelete(room.id)} className='text-red-600 hover:text-red-900'>
										Usuń
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Room Modal */}
			{showModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 max-w-md w-full'>
						<h2 className='text-2xl font-bold mb-4'>{editingRoom ? 'Edytuj Salę' : 'Nowa Sala'}</h2>

						<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Nazwa</label>
								<input {...register('name')} className='input' />
								{errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>}
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Pojemność</label>
								<input type='number' {...register('capacity', { valueAsNumber: true })} className='input' />
								{errors.capacity && <p className='text-red-500 text-sm mt-1'>{errors.capacity.message}</p>}
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-700 mb-1'>Wyposażenie (oddzielone przecinkami)</label>
								<input {...register('equipment')} className='input' placeholder='Projektor, Tablica, Klimatyzacja' />
							</div>

							<div className='flex items-center'>
								<input type='checkbox' {...register('isAvailable')} className='mr-2' />
								<label className='text-sm text-gray-700'>Dostępna</label>
							</div>

							<div className='flex space-x-2'>
								<button type='submit' disabled={isSubmitting} className='flex-1 btn btn-primary'>
									{isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
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
