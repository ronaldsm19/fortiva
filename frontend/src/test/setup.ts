// Setup global de los tests del frontend.
// Registra los matchers de jest-dom (p. ej. `toBeInTheDocument`) en el `expect` de Vitest.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta el árbol de React tras cada test para no filtrar estado entre casos.
afterEach(() => cleanup());
