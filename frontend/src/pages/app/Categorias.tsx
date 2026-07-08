import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { CategoryCard } from '@/components/CategoryCard';
import { CategoryModal } from '@/modals/CategoryModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { service } from '@/services';
import type { Category } from '@/services/types';

export function Categorias() {
  const [system, setSystem] = useState<Category[]>([]);
  const [custom, setCustom] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const load = () => {
    service.listCategories().then(({ system, custom }) => {
      setSystem(system);
      setCustom(custom);
    });
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setModal(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setModal(true);
  };
  const confirmDelete = async () => {
    if (toDelete) await service.deleteCategory(toDelete.id);
    load();
  };

  return (
    <div className="flex flex-col gap-7">
      <section>
        <h2 className="mb-3 text-[16px] font-extrabold tracking-tight">Categorías del sistema</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {system.map((c) => (
            <CategoryCard key={c.id} category={c} onEdit={openEdit} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[16px] font-extrabold tracking-tight">Categorías personalizadas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {custom.map((c) => (
            <CategoryCard key={c.id} category={c} onEdit={openEdit} onDelete={setToDelete} />
          ))}
          <button
            onClick={openNew}
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong text-text-3 transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={22} />
            <span className="text-[14px] font-bold">Nueva categoría</span>
          </button>
        </div>
      </section>

      <CategoryModal open={modal} onClose={() => setModal(false)} onSaved={load} initial={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar categoría"
        message={`¿Eliminar "${toDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
