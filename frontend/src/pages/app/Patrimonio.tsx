import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, TrendingUp, Trash2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { AssetModal } from '@/modals/AssetModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCurrency } from '@/context/CurrencyContext';
import { pct, tint, money, moneyIn, curOf, crcVal } from '@/lib/format';
import { donutColors } from '@/data/mock';
import { service } from '@/services';
import type { Asset } from '@/services/types';

export function Patrimonio() {
  const { rate } = useCurrency();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [toDelete, setToDelete] = useState<Asset | null>(null);

  const load = () => {
    service.listAssets().then(setAssets);
  };
  useEffect(load, []);

  // Totales en colones: cada activo respeta su propio TC congelado (o el actual si es previo).
  const { totalAssets, netWorth, donut } = useMemo(() => {
    const crc = (a: Asset) => crcVal(a.amount, a.amountCrc, a.fxSell ?? rate);
    const positives = assets.filter((a) => a.isAsset);
    const totalAssets = positives.reduce((s, p) => s + crc(p), 0);
    const netWorth = assets.reduce((s, p) => s + crc(p), 0);
    const donut = positives.map((p, i) => ({
      name: p.name,
      value: crc(p),
      color: donutColors[i % donutColors.length],
    }));
    return { totalAssets, netWorth, donut };
  }, [assets, rate]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setModal(true); }}>
          <Plus size={18} />
          Agregar activo
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Patrimonio neto */}
        <div
          className="rounded-card-lg p-[26px] text-white shadow"
          style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))' }}
        >
          <div className="text-[14px] font-semibold opacity-90">Patrimonio neto</div>
          <div className="fnum my-2 text-[40px] font-extrabold tracking-tight">{money(netWorth, 'CRC')}</div>
          <div className="flex items-center gap-1.5 text-[13.5px] opacity-90">
            <TrendingUp size={16} /> +4.2% este mes
          </div>
        </div>

        {/* Distribución donut */}
        <Card>
          <div className="flex items-center gap-5">
            <div className="relative h-[150px] w-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donut.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-text-3">Activos</span>
                <span className="fnum text-[15px] font-extrabold">{money(totalAssets, 'CRC')}</span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="mb-3 text-[15px] font-bold">Dónde tengo mi dinero</h3>
              <ul className="flex flex-col gap-2">
                {donut.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-[13.5px]">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="fnum font-bold">{pct(d.value, totalAssets)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Cards de activos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <Card key={a.id}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-[12px]"
                  style={{ background: tint(a.color), color: a.color }}
                >
                  <Icon name={a.icon} size={20} />
                </div>
                <span className="text-[14px] font-bold">{a.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(a); setModal(true); }} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-surface-2 hover:text-text" aria-label="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setToDelete(a)} className="grid h-8 w-8 place-items-center rounded-full text-text-3 hover:bg-neg-weak hover:text-neg" aria-label="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div
              className="fnum text-[24px] font-extrabold tracking-tight"
              style={{ color: a.isAsset ? 'var(--text)' : 'var(--neg)' }}
            >
              {a.amount < 0 ? '−' : ''}
              {moneyIn(a.amount, curOf(a), a.amountCrc, a.fxSell ?? rate)}
            </div>
          </Card>
        ))}
      </div>

      <AssetModal open={modal} onClose={() => setModal(false)} onSaved={load} initial={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) await service.deleteAsset(toDelete.id); load(); }}
        title="Eliminar activo"
        message={`¿Eliminar "${toDelete?.name}"?`}
      />
    </div>
  );
}
