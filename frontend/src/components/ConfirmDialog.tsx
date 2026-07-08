import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

/** Diálogo de confirmación reutilizable (borrar, acciones irreversibles). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '¿Confirmar?',
  message,
  confirmLabel = 'Eliminar',
  danger = true,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-[14px] text-text-2">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className={danger ? '!bg-neg text-white' : ''}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
