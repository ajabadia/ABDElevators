---
name: toast-notifier-auditor
description: Audita componentes de UI interactivos (páginas, formularios) para asegurar que existe feedback visual (Toasts) en acciones de usuario. Si falta, lo implementa.
---

# 🍞 Toast Notifier Auditor

## 🎯 Objetivo
Garantizar que **toda interacción del usuario** que implique un cambio de estado o una operación asíncrona (Guardar, Borrar, Subir, Actualizar) tenga una respuesta visual inmediata y clara mediante **Toasts**.

## 🚦 Cuándo usar
- Cuando el usuario pida "auditar feedback visual" o "revisar notificaciones".
## Checklist de Notificaciones (ERA 8)
- [ ] **Librería Canónica**: Uso exclusivo de `import { toast } from 'sonner'`.
- [ ] **Deprecación**: ❌ Prohibido el uso de `@/hooks/use-toast`. Si se detecta, migrar a `sonner`.
- [ ] **Internacionalización**: El mensaje enviado a `toast()` debe estar envuelto en `t('key')`.
- Como parte del skill compuesto `app-full-reviewer`.
- Al crear o refactorizar formularios y acciones de mutación.

## 📋 Requisitos (Inputs)
- **Código Fuente**: Componente React (`.tsx`) o Hook que maneja la lógica.
- **Contexto**: Saber si es un Client Component (`use client`).

## ⚙️ Workflow de Auditoría

### 1. Detección de Interacciones
Analiza el código buscando:
- Llamadas a API (`fetch`, `axios`, `useApiMutation`).
- Manejadores de eventos: `onSubmit`, `onClick` en botones de acción (no navegación).
- Hooks de mutación: `useMutation` (TanStack Query) o custom hooks.
- Promesas o funciones `async` desencadenadas por usuario.

### 2. Verificación de Feedback
Para cada interacción detectada, verifica:
- [ ] ¿Existe una llamada a `toast()` o `useToast()`?
- [ ] ¿Se notifica el **ÉXITO**? (Ej: "Guardado correctamente").
- [ ] ¿Se notifica el **ERROR**? (Ej: "Fallo al guardar").
- [ ] ¿El feedback es inmediato o tras la resolución de la promesa?
- [ ] **Visibilidad**: ¿Existe el componente `<Toaster />` (ej: `sonner`) en el `RootLayout`?
- [ ] **Compatibilidad**: ¿El hook `useToast` o la función `toast` utilizada es compatible con el `<Toaster />` instalado? (Evitar mezclar Radix Toast con Sonner Toaster).
- [ ] **Layering**: ¿El Toast corre el riesgo de quedar oculto por Modales o elementos con alto Z-Index? Asegurar que el Toaster esté al nivel más externo posible.

### 3. Acción Correctiva (Implementación)
Si falta feedback en alguna interacción:

#### A. Uso de `sonner` (Estándar Era 11):
1.  Importa: `import { toast } from 'sonner'`.
2.  Implementa la llamada: `toast.success(t('key_success'))` o `toast.error(t('key_error'))`.
3.  **Importante**: No instancies hooks, usa el import directo.

#### B. Si es `useApiMutation` (Hook personalizado):
1.  Verifica si se pasan `successMessage` u `onError`.
2.  Si no, agrégalos a la configuración del hook para que maneje el toast automáticamente.

## 🚫 Excepciones (No aplicar)
- **Navegación**: Clics que solo cambian de ruta (`Link`, `router.push`) no requieren toast (salvo redirección tras acción).
- **Lectura pasiva**: `GET` requests que solo cargan datos iniciales no suelen necesitar toast de éxito (quizás sí de error si es crítico).
- **Inputs**: Cambios en campos de texto (`onChange`) no requieren toast inmediato.

## 📦 Output Esperado
- **Código Refactorizado**: El componente con los imports y llamadas a `toast` añadidos.
- **Reporte**: Breve resumen de qué interacciones fueron corregidas.

---
## Ejemplo de Corrección

**Antes:**
```typescript
const handleSave = async () => {
  await saveData(data);
  setOpen(false);
};
```

**Después:**
```typescript
import { toast } from 'sonner'; // Injected

const handleSave = async () => {
  try {
    await saveData(data);
    setOpen(false);
    toast.success(t('common.success_save')); // Feedback Era 11
  } catch (error) {
    toast.error(t('common.error_save')); // Feedback Era 11
  }
};
```

