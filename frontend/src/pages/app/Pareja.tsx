import { useEffect, useState } from 'react';
import { HeartHandshake, Mail, UserPlus } from 'lucide-react';
import { Card } from '@/components/Card';
import { Switch } from '@/components/Switch';
import { Segmented } from '@/components/Segmented';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { useHousehold } from '@/context/HouseholdContext';
import { accountApi, type InviteResult } from '@/services/account';
import { service } from '@/services';
import type { CoupleConfig } from '@/services/types';

export function Pareja() {
  const { format } = useCurrency();
  const { p1Name, p2Name, hasPartner, refresh } = useHousehold();
  const [cfg, setCfg] = useState<CoupleConfig | null>(null);

  useEffect(() => {
    service.getCoupleConfig().then(setCfg);
  }, []);

  if (!cfg) return null;
  const p2 = 100 - cfg.p1;
  const salaryTotal = cfg.salaryP1 + cfg.salaryP2;
  const name1 = p1Name;
  const name2 = p2Name ?? 'Tu pareja';

  const update = (patch: Partial<CoupleConfig>) =>
    service.updateCoupleConfig(patch).then(setCfg);

  return (
    <div className="flex flex-col gap-5">
      {/* Toggle modo pareja */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[12px] bg-accent-weak text-accent">
            <HeartHandshake size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-extrabold">Modo pareja / familia</div>
            <div className="text-[13.5px] text-text-2">Compartan gastos y decidan juntos.</div>
          </div>
          <Switch
            checked={cfg.coupleMode}
            onChange={(v) => update({ coupleMode: v })}
            aria-label="Modo pareja"
          />
        </div>
      </Card>

      {cfg.coupleMode && (
        <Card>
          {/* Miembros */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-input border border-border p-4">
              <OwnerAvatar owner="Ana" size={46} />
              <div>
                <div className="text-[15px] font-bold">{name1}</div>
                <div className="text-[12.5px] text-text-3">Persona 1 · Administrador</div>
              </div>
            </div>

            {hasPartner ? (
              <div className="flex items-center gap-3 rounded-input border border-border p-4">
                <OwnerAvatar owner="Luis" size={46} />
                <div>
                  <div className="text-[15px] font-bold">{name2}</div>
                  <div className="text-[12.5px] text-text-3">Persona 2 · Miembro</div>
                </div>
              </div>
            ) : (
              <InvitePartner onInvited={refresh} />
            )}
          </div>

          {/* Reparto */}
          <h3 className="mb-3 mt-6 text-[15px] font-bold">
            ¿Cómo reparten los gastos compartidos?
          </h3>
          <Segmented
            options={[
              { value: '50', label: '50 / 50 en partes iguales' },
              { value: 'custom', label: 'Porcentaje personalizado' },
              { value: 'salary', label: 'Según ingresos (proporcional)' },
            ]}
            value={cfg.splitMode}
            onChange={(v) => update({ splitMode: v as CoupleConfig['splitMode'], ...(v === '50' ? { p1: 50 } : {}) })}
          />

          <div className="mt-5 mb-2 flex items-center justify-between text-[13.5px] font-bold">
            <span className="text-accent">{name1} · {cfg.p1}%</span>
            <span className="text-pos">{p2}% · {name2}</span>
          </div>

          {cfg.splitMode === 'salary' ? (
            salaryTotal > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-input border border-border bg-surface px-4 py-3">
                  <span className="text-[13.5px] font-semibold">Salario de {name1}</span>
                  <span className="fnum text-[15px] font-bold text-accent">{format(cfg.salaryP1)}</span>
                </div>
                <div className="flex items-center justify-between rounded-input border border-border bg-surface px-4 py-3">
                  <span className="text-[13.5px] font-semibold">Salario de {name2}</span>
                  <span className="fnum text-[15px] font-bold text-pos">{format(cfg.salaryP2)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-input border border-border bg-surface px-4 py-3 text-[13px] text-text-2">
                Registra el salario de cada persona como un ingreso a su nombre para calcular el
                reparto automáticamente.
              </div>
            )
          ) : (
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={cfg.p1}
              onChange={(e) => update({ p1: Number(e.target.value), splitMode: 'custom' })}
              className="w-full"
            />
          )}

          {/* Vista previa */}
          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3.5 text-[13px] font-semibold text-text-3">
              Vista previa — gastos compartidos del mes:{' '}
              <b className="fnum text-text">{format(cfg.sharedTotal)}</b>
            </p>
            <div className="mb-4 flex h-4 overflow-hidden rounded-full">
              <div style={{ width: `${cfg.p1}%`, background: 'var(--accent)' }} className="transition-[width] duration-200" />
              <div style={{ width: `${p2}%`, background: 'var(--pos)' }} className="transition-[width] duration-200" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-input border border-border bg-surface px-4 py-3">
                <span className="text-[13.5px] font-semibold">{name1} aporta</span>
                <span className="fnum text-[16px] font-extrabold text-accent">
                  {format(Math.round((cfg.sharedTotal * cfg.p1) / 100))}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-input border border-border bg-surface px-4 py-3">
                <span className="text-[13.5px] font-semibold">{name2} aporta</span>
                <span className="fnum text-[16px] font-extrabold text-pos">
                  {format(Math.round((cfg.sharedTotal * p2) / 100))}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Formulario para invitar a la pareja (crea su usuario + envía correo). */
function InvitePartner({ onInvited }: { onInvited: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const r = await accountApi.invitePartner({ fullName, email });
      setResult(r);
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la invitación');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-input border border-pos/30 bg-pos-weak p-4">
        <div className="mb-1 flex items-center gap-2 text-[14px] font-bold text-pos">
          <Mail size={16} /> {result.emailed ? 'Invitación enviada por correo' : 'Pareja agregada'}
        </div>
        <p className="text-[12.5px] text-text-2">
          {result.member.fullName} ya tiene acceso al hogar.
          {result.emailed
            ? ' Le enviamos sus accesos por correo.'
            : ' No se pudo enviar el correo; comparte tú la contraseña temporal:'}
        </p>
        <p className="fnum mt-1.5 text-[13px]">
          Contraseña temporal: <b className="text-accent">{result.tempPassword}</b>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2.5 rounded-input border border-dashed border-border-strong p-4"
    >
      <div className="flex items-center gap-2 text-[13.5px] font-bold text-text-2">
        <UserPlus size={16} /> Invitar a tu pareja
      </div>
      <Input placeholder="Nombre de tu pareja" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      <Input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {error && <p className="text-[12.5px] font-semibold text-neg">{error}</p>}
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? 'Enviando…' : 'Enviar invitación'}
      </Button>
    </form>
  );
}
