import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';



// Basic cuid generator for the script
const generateCuid = () => {
    return 'c' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Using Raw SQL query to insert 3 Sales Reps and 3 Members as requested
    const query = `
        INSERT INTO "User" (id, name, email, password, role, "updatedAt") VALUES
        ('${generateCuid()}', 'Sales Rep Bob', 'bob@digitalheroes.com', '${hashedPassword}', 'MEMBER', NOW()),
        ('${generateCuid()}', 'Sales Rep Charlie', 'charlie@digitalheroes.com', '${hashedPassword}', 'MEMBER', NOW()),
        ('${generateCuid()}', 'Sales Rep Dave', 'dave@digitalheroes.com', '${hashedPassword}', 'MEMBER', NOW()),
        ('${generateCuid()}', 'Member Eve', 'eve@digitalheroes.com', '${hashedPassword}', 'MEMBER', NOW()),
        ('${generateCuid()}', 'Member Frank', 'frank@digitalheroes.com', '${hashedPassword}', 'MEMBER', NOW()),
        ('${generateCuid()}', 'Member Grace', 'grace@digitalheroes.com', '${hashedPassword}', 'MEMBER', NOW());
    `;

    console.log("Executing SQL Query...");
    console.log(query);

    await prisma.$executeRawUnsafe(query);

    console.log('✅ Successfully added 3 Sales Reps and 3 Members using raw SQL!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
