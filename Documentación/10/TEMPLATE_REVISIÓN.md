# 📋 TEMPLATE PARA REVISAR CÓDIGO

**Usa esto cuando Antigravity te envíe un PR para revisar**

29 Enero 2026, 03:00 CET

---

## REVIEW CHECKLIST ESTÁNDAR

**Copiar este template para cada revisión:**

```markdown
# REVIEW: [NOMBRE DEL COMPONENTE/HOOK]

## 1. CUMPLIMIENTO DE ESPECIFICACIÓN

- [ ] **¿Funciona exactamente como especificaste?**
  - Comportamiento esperado: Sí/No/Parcial
  - Casos de uso: Todos cubiertos? Sí/No
  - Criterios de aceptación: Todos marcados? Sí/No

- [ ] **¿Falta algo de la especificación?**
  - Si no: OK
  - Si sí: Detallar qué

## 2. PREGUNTAS TÉCNICAS

Para cada sección de código que no entiendas, pregunta:

- "¿Por qué hiciste [línea X] de esta forma?"
- "¿Qué pasa si [edge case]?"
- "¿Esto es agnóstico o específico de [contexto]?"

**Ejemplos de buenas preguntas técnicas:**
```
- ¿Qué pasa si localStorage está lleno? ¿El error se loguea?
- ¿Este hook funciona en SSR o tiene problemas en servidor?
- ¿Hay memory leaks si usuario abre/cierra modal 100 veces?
- ¿El error handling captura todos los casos?
```

## 3. ROBUSTEZ

- [ ] **Error Handling**
  - ¿Qué pasa si API falla?
  - ¿Qué pasa si user cancela?
  - ¿Qué pasa si datos inválidos?

- [ ] **Validación de Inputs**
  - ¿Se validan inputs?
  - ¿Hay tipos TypeScript?

- [ ] **Edge Cases**
  - ¿Qué pasa si usuario abre modal 2 veces rápido?
  - ¿Qué pasa si datos cambian mientras procesando?

## 4. USABILIDAD

- [ ] **¿El usuario lo entenderá?**
  - ¿Hay feedback visual claro?
  - ¿Los errores son legibles?
  - ¿Las animaciones tiene sentido?

- [ ] **¿Es intuitivo?**
  - ¿El flujo es lógico?
  - ¿Hay casos donde usuario está confundido?

- [ ] **¿Funciona en mobile?**
  - ¿Botones son clickeables (48px)?
  - ¿Texto es legible?
  - ¿Modales caben en pantalla?

## 5. CÓDIGO QUALITY

- [ ] **Legibilidad**
  - ¿Está bien indentado?
  - ¿Los nombres de variables son claros?
  - ¿Hay comentarios donde necesario?

- [ ] **Documentación**
  - ¿Hay JSDoc?
  - ¿Ejemplos de uso?
  - ¿Tipos exportados y documentados?

- [ ] **Tests**
  - ¿Hay tests?
  - ¿Cubren casos principales?
  - ¿Y casos de error?

## 6. DECISIÓN FINAL

- [ ] **APROBADO** - Se mergea tal como está
- [ ] **NECESITA CAMBIOS** - Detallar abajo
- [ ] **RECHAZADO** - Requiere rewrite completa (raro)

## 7. FEEDBACK ESPECÍFICO (SI NECESITA CAMBIOS)

```
### CAMBIO 1: [Descripción]
- Dónde: [archivo:línea]
- Problema: [qué está mal]
- Solución sugerida: [cómo arreglarlo]
- Prioridad: Crítico/Alto/Medio/Bajo

### CAMBIO 2: [Descripción]
...
```

## 8. NOTAS FINALES

- Qué salió bien
- Qué aprendiste
- Preguntas para futuro
```

---

## EJEMPLO REAL DE UNA REVISIÓN

**Cuando Antigravity entrega `useFormModal`, podrías escribir:**

```markdown
# REVIEW: useFormModal

## 1. CUMPLIMIENTO
- [x] Funciona exactamente como especificaste
- [x] Los 5 casos de uso están cubiertos
- [x] Todos los criterios de aceptación cumplen
- [ ] Falta nada? No

## 2. PREGUNTAS TÉCNICAS

**Pregunta 1:** En el método `open()`, ¿qué pasa si user abre 
modal con data de usuario A, luego abre modal con usuario B 
sin cerrar primero? ¿Los datos se mezclan?

**Pregunta 2:** En `setErrors()`, ¿se puede llamar sin que 
modal esté abierto? ¿Causa problemas?

**Pregunta 3:** ¿El hook es seguro en SSR? ¿Se puede usar en 
un layout que renderiza en servidor?

## 3. ROBUSTEZ

- [x] Error handling: Bien
- [x] Validación: TypeScript types son buenos
- [x] Edge cases: Considerados

## 4. USABILIDAD

- [x] Usuario lo entiende
- [x] Feedback es claro
- [x] Mobile responsive

## 5. CÓDIGO QUALITY

- [x] Legible
- [x] JSDoc completo
- [x] Tests cubren casos principales

## 6. DECISIÓN FINAL

- [x] **APROBADO**

## 7. FEEDBACK ESPECÍFICO

Ninguno. Código está excelente.

## 8. NOTAS FINALES

- Muy bien: El patrón con useCallback es eficiente
- Aprendizaje: No sabía que se podía hacer reset() así
- Futuro: ¿Soportar validación built-in? (Zod/Yup)
```

---

## OTRO EJEMPLO: CON CAMBIOS REQUERIDOS

```markdown
# REVIEW: EntityEngine Dynamic Columns

## 1. CUMPLIMIENTO
- [x] Columnas se generan dinámicamente
- [ ] Pero falta realmente: No se actualiza cuando entity cambia
- [ ] Las 3 tablas se actualizaron? Documentos sí, Usuarios sí, 
      Pedidos NO

## 2. PREGUNTAS TÉCNICAS

Pregunta: ¿Por qué hardcodeaste las opciones de "Acciones" al final?
¿Eso no debería venir de entity.columns también?

## 3. ROBUSTEZ

- [x] Bien
- [x] Bien

## 4. USABILIDAD

Probé en mobile y las columnas dinámicas se ven cortadas. ¿Hay 
scroll horizontal o debería esconderse algo?

## 5. CÓDIGO QUALITY

- [x] Bien
- [ ] Tests: No veo test que verifique que al cambiar 
      EntityEngine, la tabla se actualiza

## 6. DECISIÓN FINAL

- [ ] **NECESITA CAMBIOS**

## 7. FEEDBACK ESPECÍFICO

### CAMBIO 1: Completar admin-pedidos.tsx
- Dónde: components/admin-pedidos.tsx
- Problema: TableHead sigue hardcodeados
- Solución: Aplicar el mismo patrón que admin-documentos
- Prioridad: Crítico (sin esto no está completo)

### CAMBIO 2: Mobile horizontal scroll
- Dónde: DataTable component
- Problema: En mobile, columnas se cortan sin scroll
- Solución: Agregar `overflow-x-auto` en <div> del table
- Prioridad: Alto (usabilidad)

### CAMBIO 3: Tests dinámicos
- Dónde: Agregar test file
- Problema: No hay test que valide dinamismos
- Solución: Test que cambia entity.columns y verifica tabla
- Prioridad: Medio

## 8. NOTAS FINALES

- Bien: El patrón es correcto
- Falta: No está 100% completo en los 3 archivos
- Futuro: ¿Soportar re-order de columnas por usuario?
```

---

## 💡 CONSEJOS PARA REVISAR

### Antes de leer código:
1. Lee la especificación nuevamente
2. Ten clara cuál es la intención
3. Abre el código con mente abierta

### Mientras lees código:
1. Si no entiendes algo → pregunta (no asumas)
2. Si algo se ve raro → probablemente lo es, pregunta
3. Si falta un caso → señálalo

### Después de revisar:
1. ¿Cumple la especificación? Sí/No = decisión clara
2. Si tiene cambios, sé específico (archivo:línea, qué cambiar, por qué)
3. Da crédito por lo que salió bien

---

## ✅ LISTO

Descarga, copia, personaliza y envía feedback.

Antigravity sabrá exactamente qué arreglar.

