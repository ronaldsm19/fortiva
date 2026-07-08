import { icons, type LucideProps, HelpCircle } from 'lucide-react';

interface Props extends LucideProps {
  /** nombre kebab-case de Lucide, p. ej. "credit-card", "home" */
  name: string;
}

/** kebab-case → PascalCase para indexar el registro de lucide-react. */
function pascal(name: string): string {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/** Renderiza cualquier icono de Lucide a partir de su nombre string. */
export function Icon({ name, ...props }: Props) {
  const Cmp = icons[pascal(name) as keyof typeof icons] ?? HelpCircle;
  return <Cmp {...props} />;
}
