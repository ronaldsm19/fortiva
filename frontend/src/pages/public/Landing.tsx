import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Layers, AlarmClockOff, EyeOff, CalendarCheck, BarChart3, BellRing,
  Users, Wallet, Shapes, TrendingDown, Landmark, Bell, HeartHandshake,
  ShieldCheck, Banknote, MailCheck,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { PricingCard } from '@/components/PricingCard';
import { service } from '@/services';
import type { PricingPlan } from '@/services/types';

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, delay: i * 0.06, ease: [0.22, 0.61, 0.36, 1] as const },
});

export function Landing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  useEffect(() => {
    service.getPricing().then(setPlans);
  }, []);

  return (
    <div>
      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(600px 400px at 80% 0%, var(--accent-weak), transparent), radial-gradient(500px 400px at 10% 90%, var(--pos-weak), transparent)',
          }}
        />
        <div className="relative mx-auto grid max-w-landing items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <motion.div {...fade(0)}>
            <Badge color="var(--pos)" bg="var(--pos-weak)" className="mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-pos" /> Finanzas de hogar, en calma
            </Badge>
            <h1 className="text-[clamp(40px,6vw,64px)] font-extrabold leading-[1.05] tracking-tight">
              El dinero de tu{' '}
              <span className="font-serif italic text-accent">familia</span>, por fin bajo control.
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-text-2">
              Fortiva reúne gastos, ingresos, deudas e inversiones en un solo lugar sereno. Con
              recordatorios de pago y modo pareja para decidir juntos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/register')}>
                Empezar prueba gratis <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
                Iniciar sesión
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-text-3">
              7 días gratis · Sin tarjeta · Cancela cuando quieras
            </p>
          </motion.div>

          {/* Tarjeta flotante */}
          <motion.div {...fade(2)} className="animate-floaty">
            <Card className="shadow-lg" pad="p-[22px]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-text-3">Julio 2026</div>
                  <div className="text-[16px] font-extrabold">Hogar Rodríguez</div>
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-pos" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-input border border-border p-4">
                  <div className="text-[12px] text-text-3">Disponible</div>
                  <div className="fnum text-[22px] font-extrabold">$1,720</div>
                </div>
                <div className="rounded-input border border-border p-4">
                  <div className="text-[12px] text-text-3">Ahorro</div>
                  <div className="fnum text-[22px] font-extrabold text-pos">$900</div>
                </div>
              </div>
              <div className="rounded-input border border-border p-4">
                <div className="mb-3 flex items-center justify-between text-[12px]">
                  <span className="text-text-3">Ingresos vs gastos</span>
                  <span className="font-semibold text-accent">6 meses</span>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[70, 78, 66, 82, 74, 88].map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col gap-1">
                      <div className="rounded-t bg-pos" style={{ height: `${h}%` }} />
                      <div className="rounded-t bg-accent-weak" style={{ height: `${h * 0.5}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="border-y border-border bg-bg-2">
        <div className="mx-auto flex max-w-landing flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-5 text-[13.5px] font-semibold text-text-2">
          <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-accent" /> Datos cifrados</span>
          <span className="flex items-center gap-2"><Banknote size={17} className="text-pos" /> USD y colones</span>
          <span className="flex items-center gap-2"><HeartHandshake size={17} className="text-gold" /> Modo pareja</span>
          <span className="flex items-center gap-2"><MailCheck size={17} className="text-accent" /> Recordatorios por correo</span>
        </div>
      </section>

      {/* 3. PROBLEMA */}
      <Section title="El desorden financiero cuesta tranquilidad">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: Layers, t: 'Gastos dispersos', d: 'Apps, cuentas y recibos por todos lados. Nada cuadra.' },
            { icon: AlarmClockOff, t: 'Pagos olvidados', d: 'Recargos por fechas que se pasan sin avisar.' },
            { icon: EyeOff, t: 'Cero visibilidad', d: 'No sabes cuánto queda libre ni a dónde se fue.' },
          ].map((c, i) => (
            <motion.div key={c.t} {...fade(i)}>
              <Card className="h-full">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-[12px] bg-neg-weak text-neg">
                  <c.icon size={20} />
                </div>
                <div className="text-[16px] font-bold">{c.t}</div>
                <p className="mt-1 text-[13.5px] text-text-2">{c.d}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 4. SOLUCIÓN */}
      <Section title="Fortiva pone todo en orden" bg>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, t: 'Control mensual', d: 'Cada mes claro: ingresos, gastos y lo libre.' },
            { icon: BarChart3, t: 'Reportes anuales', d: 'Ve tu año completo y tu tasa de ahorro.' },
            { icon: BellRing, t: 'Recordatorios', d: 'Nunca más un pago olvidado.' },
            { icon: Users, t: 'Modo pareja', d: 'Repartan gastos y decidan juntos.' },
          ].map((c, i) => (
            <motion.div key={c.t} {...fade(i)}>
              <Card className="h-full">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-[12px] bg-accent-weak text-accent">
                  <c.icon size={20} />
                </div>
                <div className="text-[15px] font-bold">{c.t}</div>
                <p className="mt-1 text-[13px] text-text-2">{c.d}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 5. CÓMO FUNCIONA */}
      <Section title="Cómo funciona">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { n: 1, t: 'Crea tu hogar', d: 'Registra tu cuenta e invita a tu pareja por correo.' },
            { n: 2, t: 'Registra el mes', d: 'Añade ingresos, gastos y deudas en segundos.' },
            { n: 3, t: 'Decide con datos', d: 'Mira tus reportes y ajusta con calma.' },
          ].map((s, i) => (
            <motion.div key={s.n} {...fade(i)} className="text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-[18px] font-extrabold text-accent-ink">
                {s.n}
              </div>
              <div className="text-[16px] font-bold">{s.t}</div>
              <p className="mt-1 text-[13.5px] text-text-2">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 6. FEATURES */}
      <Section id="features" title="Todo lo que tu hogar necesita" bg>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Wallet, t: 'Movimientos', d: 'Ingresos y gastos con categorías claras.' },
            { icon: Shapes, t: 'Categorías', d: 'Del sistema y personalizadas con presupuesto.' },
            { icon: TrendingDown, t: 'Deudas', d: 'Cuotas, saldos y avance de pago.' },
            { icon: Landmark, t: 'Patrimonio', d: 'Tus activos y patrimonio neto al día.' },
            { icon: Bell, t: 'Recordatorios', d: 'Avisos por correo antes de vencer.' },
            { icon: HeartHandshake, t: 'Modo pareja', d: 'Reparto de gastos 50/50 o personalizado.' },
          ].map((c, i) => (
            <motion.div key={c.t} {...fade(i % 3)}>
              <Card className="flex h-full items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-accent-weak text-accent">
                  <c.icon size={20} />
                </div>
                <div>
                  <div className="text-[15px] font-bold">{c.t}</div>
                  <p className="mt-1 text-[13px] text-text-2">{c.d}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 7. PRICING */}
      <Section id="pricing" title="Un plan para cada hogar">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <PricingCard key={p.name} plan={p} />
          ))}
        </div>
      </Section>

      {/* 8. CTA FINAL */}
      <section className="mx-auto max-w-landing px-5 pb-16">
        <motion.div
          {...fade(0)}
          className="rounded-[28px] px-8 py-14 text-center text-white"
          style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))' }}
        >
          <h2 className="mx-auto max-w-xl text-[clamp(26px,4vw,38px)] font-extrabold leading-tight">
            Empieza a decidir con calma este mes.
          </h2>
          <Button
            size="lg"
            className="mt-6 !bg-white !text-accent"
            onClick={() => navigate('/register')}
          >
            Empezar prueba gratis de 7 días
          </Button>
        </motion.div>
      </section>
    </div>
  );
}

function Section({
  title,
  children,
  bg = false,
  id,
}: {
  title: string;
  children: React.ReactNode;
  bg?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={bg ? 'bg-bg-2 py-16' : 'py-16'}>
      <div className="mx-auto max-w-landing px-5">
        <motion.h2 {...fade(0)} className="mb-8 text-center text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight">
          {title}
        </motion.h2>
        {children}
      </div>
    </section>
  );
}
