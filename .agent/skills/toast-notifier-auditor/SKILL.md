---
name: toast-notifier-auditor
description: Audita componentes de UI interactivos (páginas, formularios) para asegurar que existe feedback visual (Toasts) en acciones de usuario. Si falta, lo implementa.
---

# 🍞 Toast Notifier Auditor

## 🎯 Objetivo
Garantizar que **toda interacción del usuario** que implique un cambio de estado o una operación asíncrona (Guardar, Borrar, Subir, Actualizar) tenga una respuesta visual inmediata y clara mediante **Toasts**.

## 🚦 Cuándo usar este skill
- Cuando el usuario pida "auditar feedback visual" o "revisar notificaciones".
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

### 3. Acción Correctiva (Implementación)
Si falta feedback en alguna interacción:

#### A. Si ya existe `useToast`:
1.  Localiza el bloque `try/catch` o los callbacks `onSuccess/onError`.
2.  Inyecta la llamada a `toast({ title: "...", description: "...", variant: "..." })`.

#### B. Si NO existe `useToast`:
1.  Importa el hook: `import { useToast } from '@/hooks/use-toast';` (o ruta equivalente en el proyecto).
2.  Instancia el hook: `const { toast } = useToast();` al inicio del componente.
3.  Implementa las llamadas en los puntos de éxito/fracaso.

#### C. Si es `useApiMutation` (Hook personalizado):
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
const { toast } = useToast(); // Injected

const handleSave = async () => {
  try {
    await saveData(data);
    setOpen(false);
    toast({ title: "Guardado", description: "Los cambios se han guardado correctamente." }); // Feedback
  } catch (error) {
    toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" }); // Feedback
  }
};
```
