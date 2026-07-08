import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { baseCategories } from '../src/domain/baseCategories';

const prisma = new PrismaClient();

const d = (iso: string) => new Date(iso);

async function main() {
  const email = 'ana@fortiva.app';

  // Idempotencia: si ya existe el usuario demo, no re-sembramos.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('ℹ️  Seed ya aplicado (usuario demo existe). Nada que hacer.');
    return;
  }

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const customCategories: Prisma.CategoryCreateWithoutAccountInput[] = [
    { name: 'Educación', icon: 'graduation-cap', color: '#7C4DBF', kind: 'custom', budgetCents: 25000 },
    { name: 'Salud', icon: 'heart-pulse', color: '#C0398A', kind: 'custom', budgetCents: 20000 },
    { name: 'Mascota', icon: 'paw-print', color: '#3E8AA9', kind: 'custom', budgetCents: 12000 },
  ];

  const account = await prisma.account.create({
    data: {
      name: 'Hogar Rodríguez',
      plan: 'hogar',
      coupleMode: true,
      splitMode: 'custom',
      splitP1Pct: 60,
      status: 'trialing',
      // Trial arrancará en el primer login; lo dejamos null a propósito.
      users: {
        create: [
          {
            email,
            passwordHash,
            fullName: 'Ana Rodríguez',
            role: 'admin',
            personKey: 'ana',
            nationalId: '1-2345-6789',
            phone: '8888-8888',
          },
          {
            email: 'luis@fortiva.app',
            passwordHash,
            fullName: 'Luis Rodríguez',
            role: 'member',
            personKey: 'luis',
          },
        ],
      },
      categories: { create: [...baseCategories, ...customCategories] },
      reminders: {
        create: [
          { name: 'Electricidad', issuer: 'ICE', amountCents: 7800, dueDate: d('2026-07-08'), status: 'pending', emailEnabled: true, icon: 'zap' },
          { name: 'Agua', issuer: 'AyA', amountCents: 2400, dueDate: d('2026-07-10'), status: 'pending', emailEnabled: true, icon: 'droplet' },
          { name: 'Internet', issuer: 'Kölbi', amountCents: 4500, dueDate: d('2026-07-12'), status: 'paid', emailEnabled: true, icon: 'wifi' },
          { name: 'Tarjeta de crédito', issuer: 'BAC', amountCents: 21000, dueDate: d('2026-07-20'), status: 'pending', emailEnabled: false, icon: 'credit-card' },
        ],
      },
      assets: {
        create: [
          { name: 'Efectivo', amountCents: 120000, icon: 'banknote', color: '#A9822F', isAsset: true },
          { name: 'Cuenta bancaria', amountCents: 840000, icon: 'building-2', color: '#2456C9', isAsset: true },
          { name: 'Inversiones', amountCents: 1520000, icon: 'trending-up', color: '#2E8B6B', isAsset: true },
          { name: 'Ahorros', amountCents: 630000, icon: 'piggy-bank', color: '#7C4DBF', isAsset: true },
          { name: 'Deuda total', amountCents: -960000, icon: 'trending-down', color: '#C0503B', isAsset: false },
        ],
      },
      debts: {
        create: [
          { name: 'Tarjeta de crédito', issuer: 'BAC', ownerKey: 'pareja', totalCents: 300000, paidCents: 120000, monthlyCents: 25000, rate: '24% anual', dueDate: d('2026-07-20'), icon: 'credit-card' },
          { name: 'Préstamo de auto', issuer: 'Banco Nacional', ownerKey: 'ana', totalCents: 1200000, paidCents: 650000, monthlyCents: 32000, rate: '9% anual', dueDate: d('2026-07-05'), icon: 'car' },
          { name: 'Financiamiento laptop', issuer: 'Gollo', ownerKey: 'luis', totalCents: 150000, paidCents: 90000, monthlyCents: 15000, rate: '0% (promo)', dueDate: d('2026-07-15'), icon: 'laptop' },
          { name: 'Préstamo estudiantil', issuer: 'Conape', ownerKey: 'luis', totalCents: 500000, paidCents: 240000, monthlyCents: 12000, rate: '6% anual', dueDate: d('2026-07-28'), icon: 'graduation-cap' },
        ],
      },
    },
    include: { categories: true, users: true },
  });

  // Movimientos (necesitan referenciar categorías por nombre).
  const catId = (name: string) => account.categories.find((c) => c.name === name)?.id;
  const anaId = account.users.find((u) => u.personKey === 'ana')?.id;

  const movements: Prisma.MovementCreateManyInput[] = [
    { accountId: account.id, categoryId: catId('Gastos fijos'), userId: anaId, type: 'income', amountCents: 520000, description: 'Salario mensual', occurredOn: d('2026-07-05'), scope: 'shared', ownerKey: 'pareja', icon: 'briefcase' },
    { accountId: account.id, categoryId: catId('Gastos fijos'), type: 'expense', amountCents: 120000, description: 'Alquiler', occurredOn: d('2026-07-04'), scope: 'shared', ownerKey: 'pareja', icon: 'home' },
    { accountId: account.id, categoryId: catId('Gastos afuera'), type: 'expense', amountCents: 6800, description: 'Cena restaurante', occurredOn: d('2026-07-03'), scope: 'individual', ownerKey: 'ana', icon: 'utensils' },
    { accountId: account.id, categoryId: catId('Inversión'), type: 'expense', amountCents: 50000, description: 'Aporte S&P 500', occurredOn: d('2026-07-02'), scope: 'shared', ownerKey: 'pareja', icon: 'trending-up' },
    { accountId: account.id, categoryId: catId('Gastos fijos'), type: 'expense', amountCents: 4500, description: 'Internet Kölbi', occurredOn: d('2026-07-02'), scope: 'shared', ownerKey: 'pareja', icon: 'wifi' },
    { accountId: account.id, categoryId: catId('Fondo de seguridad'), type: 'expense', amountCents: 30000, description: 'Ahorro emergencia', occurredOn: d('2026-07-01'), scope: 'shared', ownerKey: 'pareja', icon: 'shield' },
    { accountId: account.id, categoryId: catId('Gastos afuera'), type: 'expense', amountCents: 5200, description: 'Súper extra', occurredOn: d('2026-07-01'), scope: 'individual', ownerKey: 'luis', icon: 'shopping-cart' },
    { accountId: account.id, type: 'income', amountCents: 32000, description: 'Freelance diseño', occurredOn: d('2026-06-28'), scope: 'individual', ownerKey: 'ana', icon: 'sparkles' },
    { accountId: account.id, categoryId: catId('Gastos afuera'), type: 'expense', amountCents: 3800, description: 'Café con clientes', occurredOn: d('2026-06-27'), scope: 'individual', ownerKey: 'luis', icon: 'coffee' },
  ];
  await prisma.movement.createMany({ data: movements });

  console.log('✅ Seed completado.');
  console.log('   Cuenta:', account.name, `(${account.id})`);
  console.log('   Login demo → ana@fortiva.app / demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
