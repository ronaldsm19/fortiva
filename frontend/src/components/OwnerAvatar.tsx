import { ownerMeta } from '@/data/mock';
import { useHousehold } from '@/context/HouseholdContext';
import type { OwnerKey } from '@/services/types';

interface Props {
  owner: OwnerKey;
  size?: number;
}

/** Avatar circular con gradiente (identidad de la persona) e inicial(es) reales. */
export function OwnerAvatar({ owner, size = 32 }: Props) {
  const meta = ownerMeta[owner];
  const { ownerInitial } = useHousehold();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: meta.grad,
        fontSize: size * 0.4,
      }}
    >
      {ownerInitial(owner)}
    </div>
  );
}
