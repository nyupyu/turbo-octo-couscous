import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Seeding database...');

	// Create rooms
	const rooms = [
		{
			name: 'Sala A',
			capacity: 20,
			equipment: ['Projektor', 'Tablica'],
			isAvailable: true,
		},
		{
			name: 'Sala B',
			capacity: 50,
			equipment: ['Projektor', 'Nagłośnienie', 'Klimatyzacja'],
			isAvailable: true,
		},
		{
			name: 'Sala C',
			capacity: 10,
			equipment: ['Monitor', 'Tablica'],
			isAvailable: true,
		},
		{
			name: 'Sala D',
			capacity: 100,
			equipment: ['Projektor', 'Nagłośnienie', 'Klimatyzacja', 'System konferencyjny', 'Streaming'],
			isAvailable: true,
		},
		{
			name: 'Sala E',
			capacity: 30,
			equipment: ['Projektor', 'Tablica', 'Klimatyzacja'],
			isAvailable: true,
		},
	];

	for (const room of rooms) {
		const created = await prisma.room.upsert({
			where: { name: room.name },
			update: {},
			create: room,
		});
		console.log(`Created room: ${created.name}`);
	}

	// Create sample bookings
	const allRooms = await prisma.room.findMany();

	if (allRooms.length > 0) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(10, 0, 0, 0);

		const endTime = new Date(tomorrow);
		endTime.setHours(12, 0, 0, 0);

		// Note: userId will need to be updated after auth-service creates users
		const sampleBooking = {
			roomId: allRooms[0].id,
			userId: 'placeholder-user-id', // This should be replaced with actual user ID
			startTime: tomorrow,
			endTime: endTime,
			purpose: 'Sample Meeting',
			status: 'ACTIVE' as const,
		};

		console.log('Sample booking data prepared (userId needs to be updated)');
	}

	console.log('Seeding completed!');
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
