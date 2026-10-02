#!/bin/bash
cd /var/www/cashin-tap

# Load env
export $(grep -v '^#' .env | xargs)

node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.feeRule.deleteMany();
    await prisma.feeRule.createMany({
      data: [
        { service: 'WALLET_FUND', feeType: 'FIXED', amount: 15 },
        { service: 'ELOAD', feeType: 'FIXED', amount: 2 },
        { service: 'CASHOUT', feeType: 'FIXED', amount: 15 },
      ],
    });
    console.log('Fee rules seeded');

    await prisma.eloadProduct.deleteMany();
    const networks = ['Globe', 'Smart', 'DITO', 'TM', 'TNT', 'Sun'];
    const amounts = [10, 20, 50, 100, 300, 500, 1000];
    await prisma.eloadProduct.createMany({
      data: networks.flatMap(n => amounts.map(a => ({
        network: n,
        productCode: n.toUpperCase() + '_' + a,
        name: n + ' P' + a + ' Regular Load',
        amount: a,
      }))),
    });
    console.log('Eload products seeded');

    const existing = await prisma.user.findUnique({ where: { mobile: '09000000000' } });
    if (!existing) {
      const hash = await bcrypt.hash('Admin@1234', 12);
      const admin = await prisma.user.create({
        data: {
          userId: 'USR-0000001',
          firstName: 'Super',
          lastName: 'Admin',
          mobile: '09000000000',
          email: 'admin@cashintap.com',
          passwordHash: hash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          mobileVerified: true,
          emailVerified: true,
          referralCode: 'ADMIN001',
        },
      });
      await prisma.wallet.create({
        data: { walletId: 'WAL-0000001', accountNumber: '8800000001', userId: admin.id },
      });
      console.log('Admin created:', admin.userId);
    } else {
      await prisma.user.update({
        where: { mobile: '09000000000' },
        data: { status: 'ACTIVE', mobileVerified: true, role: 'SUPER_ADMIN' },
      });
      console.log('Admin updated');
    }

    console.log('SEED COMPLETE');
  } finally {
    await prisma.\$disconnect();
  }
}

main().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
" 2>&1
