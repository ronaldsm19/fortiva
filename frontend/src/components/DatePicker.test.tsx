import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DatePicker } from '@/components/DatePicker';

// Usamos un valor fijo ('2026-07-15') para que el calendario abra en julio 2026 y los
// asserts sean deterministas (sin depender de la fecha actual).
describe('DatePicker', () => {
  it('muestra el placeholder cuando no hay valor', () => {
    render(<DatePicker value="" onChange={() => {}} placeholder="dd/mm/aaaa" />);
    expect(screen.getByText('dd/mm/aaaa')).toBeInTheDocument();
  });

  it('muestra la fecha formateada cuando hay valor', () => {
    render(<DatePicker value="2026-07-15" onChange={() => {}} />);
    expect(screen.getByText('15 jul 2026')).toBeInTheDocument();
  });

  it('al elegir un día llama onChange con ISO YYYY-MM-DD', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-07-15" onChange={onChange} />);

    // Abre el popover del calendario.
    fireEvent.click(screen.getByRole('button', { name: /15 jul 2026/i }));
    const dialog = screen.getByRole('dialog');

    // Elige el día 10 de julio 2026.
    fireEvent.click(within(dialog).getByText('10'));
    expect(onChange).toHaveBeenCalledWith('2026-07-10');
  });

  it('el botón "Limpiar" llama onChange con cadena vacía', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-07-15" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /15 jul 2026/i }));
    fireEvent.click(screen.getByText('Limpiar'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
