import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import RoomsAdminPage from './pages/RoomsAdminPage';
import LogsPage from './pages/LogsPage';

function App() {
	const { user, isAuthenticated } = useAuthStore();

	return (
		<BrowserRouter>
			<Routes>
				<Route path='/login' element={!isAuthenticated ? <LoginPage /> : <Navigate to='/' />} />
				<Route path='/register' element={!isAuthenticated ? <RegisterPage /> : <Navigate to='/' />} />
				<Route path='/' element={isAuthenticated ? <Layout /> : <Navigate to='/login' />}>
					<Route index element={<DashboardPage />} />
					<Route path='bookings' element={<BookingsPage />} />
					{user?.role === 'ADMIN' && (
						<>
							<Route path='admin/rooms' element={<RoomsAdminPage />} />
							<Route path='admin/logs' element={<LogsPage />} />
						</>
					)}
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default App;
