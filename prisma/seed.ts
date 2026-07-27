import { prisma } from '../lib/prisma';
import { Role } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
    await prisma.note.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@digitalheroes.com',
            password: hashedPassword,
            role: Role.ADMIN,
        },
    });

    const member = await prisma.user.create({
        data: {
            name: 'Sales Rep Alex',
            email: 'member@digitalheroes.com',
            password: hashedPassword,
            role: Role.MEMBER,
        },
    });

    console.log({ admin, member });
    console.log('🌱 Seed data inserted successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });