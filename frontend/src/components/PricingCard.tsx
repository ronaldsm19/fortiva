import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './Badge';
import { Button } from './Button';
import type { PricingPlan } from '@/services/types';

export function PricingCard({ plan }: { plan: PricingPlan }) {
  const navigate = useNavigate();
  return (
    <div
      className={`relative rounded-card-lg border bg-surface p-[26px] shadow-sm transition-transform duration-150 hover:-translate-y-1 ${
        plan.featured ? 'border-accent shadow' : 'border-border'
      }`}
    >
      {plan.featured && (
        <Badge
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          color="var(--accent-ink)"
          bg="var(--accent)"
        >
          Recomendado
        </Badge>
      )}
      <div className="text-[16px] font-bold">{plan.name}</div>
      <div className="mb-1 mt-2 flex items-end gap-1">
        <span className="fnum text-[36px] font-extrabold tracking-tight">{plan.price}</span>
        <span className="mb-2 text-[14px] text-text-3">/mes</span>
      </div>
      <p className="mb-5 text-[13.5px] text-text-2">{plan.desc}</p>
      <ul className="mb-6 flex flex-col gap-2.5">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2 text-[13.5px] text-text">
            <Check size={16} className="text-pos" />
            {perk}
          </li>
        ))}
      </ul>
      <Button
        variant={plan.featured ? 'primary' : 'secondary'}
        className="w-full"
        onClick={() => navigate('/register')}
      >
        {plan.cta}
      </Button>
    </div>
  );
}
