/**
 * Crea (o reinicia la contraseña de) un usuario real con una cuenta poblada.
 * Uso:  tsx prisma/create-user.ts <email> "<Nombre>" "<Nombre del hogar>"
 * Genera una contraseña aleatoria y la imprime.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { baseCategories } from '../src/domain/baseCategories';

const prisma = new PrismaClient();
const d = (iso: string) => new Date(iso);

const email = process.argv[2] ?? 'ronaldsm13.rsm@gmail.com';
const fullName = process.argv[3] ?? 'Ronald';
const accountName = process.argv[4] ?? 'Hogar de Ronald';

function genPassword(): string {
  // 12 caracteres alfanuméricos, fáciles de teclear una vez.
  return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

async function main() {
  const password = genPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { passwordHash, mustChangePw: false } });
    console.log('ℹ️  El usuario ya existía; contraseña REINICIADA.');
    console.log('   email:', email);
    console.log('   nueva contraseña:', password);
    return;
  }

  const customCategories: Prisma.CategoryCreateWithoutAccountInput[] = [
    { name: 'Educación', icon: 'graduation-cap', color: '#7C4DBF', kind: 'custom', budgetCents: 25000 },
    { name: 'Salud', icon: 'heart-pulse', color: '#C0398A', kind: 'custom', budgetCents: 20000 },
    { name: 'Mascota', icon: 'paw-print', color: '#3E8AA9', kind: 'custom', budgetCents: 12000 },
  ];

  const account = await prisma.account.create({
    data: {
      name: accountName,
      plan: 'hogar',
      coupleMode: true,
      splitMode: 'custom',
      splitP1Pct: 60,
      status: 'trialing',
      users: {
        create: [
          { email, passwordHash, fullName, role: 'admin', personKey: 'ana' },
          { email: `luis+${Date.now()}@fortiva.app`, passwordHash, fullName: 'Luis', role: 'member', personKey: 'luis' },
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

  const catId = (name: string) => account.categories.find((c) => c.name === name)?.id ?? null;
  const anaId = account.users.find((u) => u.personKey === 'ana')?.id ?? null;

  // Movimientos en varios meses para que los gráficos se vean con vida.
  const rows: Prisma.MovementCreateManyInput[] = [];
  const push = (o: Partial<Prisma.MovementCreateManyInput> & { amountCents: number; type: 'income' | 'expense'; occurredOn: Date; description: string }) =>
    rows.push({ accountId: account.id, scope: 'shared', ownerKey: 'pareja', icon: 'wallet', ...o });

  // Histórico simple: salario + gastos fijos en Feb..Jul 2026
  for (let m = 1; m <= 6; m++) {
    const mm = String(m + 1).padStart(2, '0');
    push({ categoryId: catId('Gastos fijos'), userId: anaId, type: 'income', amountCents: 500000 + m * 4000, description: 'Salario mensual', occurredOn: d(`2026-${mm}-05`), icon: 'briefcase' });
    push({ categoryId: catId('Gastos fijos'), type: 'expense', amountCents: 120000, description: 'Alquiler', occurredOn: d(`2026-${mm}-04`), icon: 'home' });
    push({ categoryId: catId('Inversión'), type: 'expense', amountCents: 50000, description: 'Aporte S&P 500', occurredOn: d(`2026-${mm}-02`), icon: 'trending-up' });
    push({ categoryId: catId('Gastos afuera'), type: 'expense', amountCents: 6800, description: 'Cena restaurante', scope: 'individual', ownerKey: 'ana', occurredOn: d(`2026-${mm}-03`), icon: 'utensils' });
  }
  // Mes actual: extras
  push({ categoryId: catId('Fondo de seguridad'), type: 'expense', amountCents: 30000, description: 'Ahorro emergencia', occurredOn: d('2026-07-01'), icon: 'shield' });
  push({ type: 'income', amountCents: 32000, description: 'Freelance diseño', scope: 'individual', ownerKey: 'ana', occurredOn: d('2026-06-28'), icon: 'sparkles' });

  await prisma.movement.createMany({ data: rows });

  console.log('✅ Usuario y cuenta creados.');
  console.log('   Hogar:', accountName, `(${account.id})`);
  console.log('   ───────────────────────────────');
  console.log('   📧 email:      ', email);
  console.log('   🔑 contraseña: ', password);
  console.log('   ───────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
