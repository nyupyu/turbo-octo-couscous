import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	console.log('Seeding database...');

	// Create admin user
	const adminPassword = await bcrypt.hash('Admin123!', 12);
	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			email: 'admin@example.com',
			passwordHash: adminPassword,
			role: 'ADMIN',
		},
	});

	console.log('Created admin user:', admin.email);

	// Create regular user
	const userPassword = await bcrypt.hash('User123!', 12);
	const user = await prisma.user.upsert({
		where: { email: 'user@example.com' },
		update: {},
		create: {
			email: 'user@example.com',
			passwordHash: userPassword,
			role: 'USER',
		},
	});

	console.log('Created regular user:', user.email);

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
