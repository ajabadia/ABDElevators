/**
 * 🦄 Factory genérica para implementar el patrón Singleton de forma limpia.
 * Reemplaza el boilerplate de 'private static instance' y 'getInstance()'.
 */
export function createSingleton<T>(factory: () => T): () => T {
  let instance: T | null = null;

  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}
