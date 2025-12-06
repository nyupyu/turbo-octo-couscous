import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Log } from '../types';
import api from '../services/api';

export default function LogsPage() {
	const [logs, setLogs] = useState<Log[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [filters, setFilters] = useState({
		serviceName: '',
		action: '',
		userId: '',
	});
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		fetchLogs();
	}, [filters, page]);

	const fetchLogs = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (filters.serviceName) params.append('serviceName', filters.serviceName);
			if (filters.action) params.append('action', filters.action);
			if (filters.userId) params.append('userId', filters.userId);
			params.append('page', page.toString());
			params.append('limit', '20');

			const response = await api.get(`/logs?${params.toString()}`);
			setLogs(response.data.logs);
			setTotalPages(response.data.pagination.totalPages);
		} catch (err) {
			setError('Błąd pobierania logów');
		} finally {
			setLoading(false);
		}
	};

	const handleFilterChange = (field: string, value: string) => {
		setFilters({ ...filters, [field]: value });
		setPage(1);
	};

	const clearFilters = () => {
		setFilters({ serviceName: '', action: '', userId: '' });
		setPage(1);
	};

	if (loading && logs.length === 0) {
		return <div className='text-center py-8'>Ładowanie...</div>;
	}

	return (
		<div>
			<h1 className='text-3xl font-bold mb-6'>Logi Systemowe</h1>

			{error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

			{/* Filters */}
			<div className='card mb-6'>
				<h2 className='text-lg font-semibold mb-4'>Filtry</h2>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Serwis</label>
						<select value={filters.serviceName} onChange={e => handleFilterChange('serviceName', e.target.value)} className='input'>
							<option value=''>Wszystkie</option>
							<option value='auth-service'>auth-service</option>
							<option value='crud-service'>crud-service</option>
							<option value='logs-service'>logs-service</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Akcja</label>
						<select value={filters.action} onChange={e => handleFilterChange('action', e.target.value)} className='input'>
							<option value=''>Wszystkie</option>
							<option value='user.registered'>user.registered</option>
							<option value='user.logged_in'>user.logged_in</option>
							<option value='room.created'>room.created</option>
							<option value='room.updated'>room.updated</option>
							<option value='room.deleted'>room.deleted</option>
							<option value='booking.created'>booking.created</option>
							<option value='booking.updated'>booking.updated</option>
							<option value='booking.deleted'>booking.deleted</option>
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-1'>User ID</label>
						<input type='text' value={filters.userId} onChange={e => handleFilterChange('userId', e.target.value)} className='input' placeholder='UUID użytkownika' />
					</div>

					<div className='flex items-end'>
						<button onClick={clearFilters} className='btn btn-secondary w-full'>
							Wyczyść filtry
						</button>
					</div>
				</div>
			</div>

			{/* Logs Table */}
			<div className='bg-white rounded-lg shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Czas</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Serwis</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Akcja</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>User ID</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Szczegóły</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>IP</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{logs.map(log => (
								<tr key={log.id}>
									<td className='px-6 py-4 whitespace-nowrap text-sm'>{format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm'>{log.serviceName}</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>{log.action}</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{log.userId ? <span className='truncate inline-block max-w-[100px]'>{log.userId}</span> : 'N/A'}
									</td>
									<td className='px-6 py-4 text-sm text-gray-500'>
										{log.details ? (
											<details className='cursor-pointer'>
												<summary>Zobacz</summary>
												<pre className='mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-xs'>{JSON.stringify(log.details, null, 2)}</pre>
											</details>
										) : (
											'Brak'
										)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{log.ipAddress}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className='flex justify-center items-center space-x-2 mt-6'>
					<button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className='btn btn-secondary disabled:opacity-50'>
						Poprzednia
					</button>
					<span className='text-gray-700'>
						Strona {page} z {totalPages}
					</span>
					<button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className='btn btn-secondary disabled:opacity-50'>
						Następna
					</button>
				</div>
			)}
		</div>
	);
}
