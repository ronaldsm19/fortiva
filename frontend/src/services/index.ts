import type { FortivaService } from './service.interface';
import { mockService } from './mock/mock.service';
import { apiService } from './api/api.service';

/**
 * Selector de implementación según VITE_API_MODE.
 *   mock → Fase 1 (sin backend)
 *   api  → Fase 3+ (backend real)
 * Las páginas importan SIEMPRE desde aquí: `import { service } from '@/services'`.
 */
const mode = import.meta.env.VITE_API_MODE ?? 'mock';

export const service: FortivaService = mode === 'api' ? apiService : mockService;
export type { FortivaService } from './service.interface';
