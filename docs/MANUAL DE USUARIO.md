# 📘 Manual de Usuario - Sistema de Validación de Pedidos

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Roles y Permisos](#roles-y-permisos)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Guía por Rol](#guía-por-rol)
6. [Preguntas Frecuentes](#preguntas-frecuentes)
7. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

### ¿Qué es este sistema?

Sistema de gestión y validación de pedidos de ascensores que utiliza **Inteligencia Artificial** para:

- ✅ **Analizar automáticamente** especificaciones técnicas
- ✅ **Generar listas de validación** personalizadas
- ✅ **Guiar a operarios** paso a paso en el montaje
- ✅ **Garantizar conformidad** con normativas técnicas
- ✅ **Registrar evidencias** de cada validación

### Beneficios principales

| Beneficio | Descripción |
|-----------|-------------|
| **Reducción de errores** | Validación sistemática elimina olvidos |
| **Trazabilidad completa** | Registro de cada paso con timestamp y responsable |
| **Ahorro de tiempo** | IA genera checklist en minutos vs. horas manual |
| **Mejora continua** | Análisis de no conformidades para optimizar procesos |
| **Conformidad normativa** | Garantiza cumplimiento de EN 81-20/50, UNE, etc. |

---

## Primeros Pasos

### 1️⃣ Acceso al Sistema

**URL del sistema:** `https://[TU-DOMINIO].vercel.app`

**Credenciales iniciales:**
- Las recibirás por email del administrador
- **Importante:** Cambia tu contraseña en el primer login

### 2️⃣ Primer Login

1. Abre la URL en tu navegador
2. Introduce tu **email** y **contraseña**
3. Haz clic en "Iniciar Sesión"
4. Si es tu primer acceso, el sistema te pedirá cambiar la contraseña

### 3️⃣ Cambiar Contraseña (Recomendado)

1. Ve a tu perfil (icono de usuario arriba a la derecha)
2. Haz clic en "Cambiar Contraseña"
3. Introduce:
   - Contraseña actual
   - Nueva contraseña (mín. 8 caracteres, 1 mayúscula, 1 número)
   - Confirma la nueva contraseña
4. Haz clic en "Guardar"

### 4️⃣ Explorar el Dashboard

**Elementos principales:**

┌─────────────────────────────────────────────────────────┐
│ [Logo] Pedidos Base Conocimiento Analítica [👤] │
├─────────────────────────────────────────────────────────┤
│ │
│ 📊 Resumen General │
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 5 │ │ 3 │ │ 2 │ │
│ │ En Curso │ │ Listos │ │Completados│ │
│ └──────────┘ └──────────┘ └──────────┘ │
│ │
│ 📋 Últimos Pedidos │
│ ┌─────────────────────────────────────────────┐ │
│ │ ASC-2024-042 Edificio Rosales [Ver] │ │
│ │ ASC-2024-041 Torre Vista [Ver] │ │
│ └─────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────┘

text

---

## Roles y Permisos

### 👑 Administrador

**Puede hacer TODO:**

- ✅ Crear, editar, eliminar pedidos
- ✅ Asignar pedidos a operarios
- ✅ Subir documentos a la base de conocimiento
- ✅ Analizar pedidos con IA
- ✅ Ver analítica completa
- ✅ Gestionar usuarios (crear, modificar roles)

### 👷 Ingeniero/Técnico

**Puede:**

- ✅ Crear y editar pedidos
- ✅ Asignar pedidos a operarios
- ✅ Subir documentos técnicos
- ✅ Analizar pedidos con IA
- ✅ Ver progreso de todos los pedidos

**No puede:**

- ❌ Eliminar pedidos
- ❌ Ver analítica completa
- ❌ Gestionar usuarios

### 🔧 Operario

**Puede:**

- ✅ Ver su tarea asignada
- ✅ Completar validaciones paso a paso
- ✅ Marcar como conforme/no conforme
- ✅ Añadir notas sobre problemas

**No puede:**

- ❌ Crear pedidos
- ❌ Asignar tareas
- ❌ Acceder a otros pedidos
- ❌ Ver base de conocimiento

---

## Flujo de Trabajo

### Visión General

┌─────────────┐
│ 1. CREAR │ Ingeniero crea pedido con componentes
└──────┬──────┘
│
▼
┌─────────────┐
│ 2. ANALIZAR │ IA genera validaciones desde documentos
└──────┬──────┘
│
▼
┌─────────────┐
│ 3. ASIGNAR │ Ingeniero asigna a operario
└──────┬──────┘
│
▼
┌─────────────┐
│ 4. VALIDAR │ Operario completa checklist paso a paso
└──────┬──────┘
│
▼
┌─────────────┐
│ 5. REVISAR │ Ingeniero revisa no conformidades
└──────┬──────┘
│
▼
┌─────────────┐
│6. COMPLETAR │ Pedido marcado como finalizado
└─────────────┘

text

### Tiempos Estimados

| Fase | Tiempo Estimado |
|------|-----------------|
| Crear pedido | 5-10 minutos |
| Análisis con IA | 2-5 minutos (automático) |
| Asignar a operario | 30 segundos |
| Validación en campo | 1-4 horas (depende del pedido) |
| Revisión de no conformidades | 10-30 minutos |

---

## Guía por Rol

### 👑 ADMIN / INGENIERO: Crear un Pedido

#### Paso 1: Acceder a Crear Pedido

1. Haz clic en **"Pedidos"** en el menú superior
2. Haz clic en el botón **"+ Nuevo Pedido"**

#### Paso 2: Información Básica

Completa los siguientes campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nº Pedido*** | Identificador único | `ASC-2024-042` |
| **Título*** | Descripción breve | `Ascensor 6 plantas - Edificio Rosales` |
| **Capacidad** | Peso máximo | `450kg (6 personas)` |
| **Descripción** | Detalles adicionales | `Ascensor panorámico con puertas automáticas` |
| **Dirección** | Ubicación instalación | `Calle Mayor 123, Zaragoza` |
| **Nº Plantas** | Pisos del edificio | `6` |

**Campos obligatorios marcados con ***

#### Paso 3: Añadir Componentes

Para cada componente del pedido:

1. Haz clic en **"+ Añadir Componente"**
2. Rellena:
   - **Código***: Código del componente (ej: `BTN-CASIO-X100`)
   - **Nombre***: Descripción (ej: `Botonera CASIO modelo X100`)
   - **Cantidad***: Número de unidades (ej: `1`)
3. Repite para todos los componentes

**💡 Tip:** Usa códigos claros y consistentes para facilitar búsquedas

#### Paso 4: Guardar

1. Revisa todos los datos
2. Haz clic en **"Crear Pedido"**
3. Verás un mensaje de confirmación
4. El pedido aparecerá con estado **"Borrador"**

---

### 👑 ADMIN / INGENIERO: Analizar con IA

#### Antes de Analizar

**Requisitos:**

- ✅ Base de conocimiento debe tener documentos técnicos subidos
- ✅ Pedido debe estar en estado "Borrador" o "Analizando"
- ✅ Al menos 1 componente añadido

#### Proceso de Análisis

1. Abre el pedido
2. Haz clic en **"🤖 Analizar con IA"**
3. Espera 2-5 minutos (verás una barra de progreso)
4. La IA:
   - Busca en documentación técnica
   - Identifica normativas aplicables
   - Genera validaciones específicas para cada componente
   - Ordena pasos de forma lógica

#### Resultado

Cuando termina:

- ✅ Estado cambia a **"Listo para Asignar"**
- ✅ Se crean automáticamente validaciones por componente
- ✅ Cada validación incluye:
  - Instrucción clara
  - Orden de ejecución
  - Fuente (documento técnico)
  - Criticidad (crítica o normal)

**Ejemplo de validaciones generadas:**

Componente: Botonera CASIO X100

[CRÍTICA] Verificar alimentación 24V DC según esquema eléctrico
Fuente: Manual Instalación CASIO X100 - Página 12

Comprobar LEDs indicadores funcionan correctamente
Fuente: Manual Instalación CASIO X100 - Página 15

Validar conexión bus CAN con controlador principal
Fuente: Esquema Conexiones Sistema - Página 8

text

---

### 👑 ADMIN / INGENIERO: Asignar a Operario

#### Paso 1: Abrir Pedido

1. Ve a **"Pedidos"**
2. Busca el pedido con estado **"Listo para Asignar"**
3. Haz clic para abrirlo

#### Paso 2: Asignar

1. En la sección **"Asignación"**, haz clic en **"Asignar Operario"**
2. Selecciona el operario del desplegable
3. Haz clic en **"Confirmar Asignación"**

#### Paso 3: Notificación

- ✅ El operario verá la tarea en su vista "Mi Tarea"
- ✅ Estado del pedido cambia a **"En Progreso"**
- ✅ El operario puede empezar validaciones

**💡 Tip:** Asigna a operarios con experiencia en ese tipo de instalación

---

### 🔧 OPERARIO: Completar Validaciones

#### Acceso a Mi Tarea

1. Haz login con tus credenciales
2. Automáticamente verás tu tarea asignada
3. **No puedes ver otros pedidos** (solo el tuyo)

#### Interfaz Móvil

El sistema está **optimizado para móvil/tablet** para usar en campo:

┌──────────────────────────────┐
│ ASC-2024-042 │
│ Paso 3 / 25 │
│ [████████░░░░░░░░] 32% │
├──────────────────────────────┤
│ │
│ 🔧 Botonera CASIO X100 │
│ Código: BTN-CASIO-X100 │
│ Cantidad: 1 │
│ │
│ ────────────────────────── │
│ │
│ 🚨 VALIDACIÓN CRÍTICA │
│ │
│ Verificar alimentación │
│ 24V DC según esquema │
│ eléctrico │
│ │
│ 📄 Fuente: Manual X100 p.12 │
│ │
│ ────────────────────────── │
│ │
│ Notas (si no conforme): │
│ [____________________] │
│ │
│ [✓ CONFORME - CONTINUAR] │
│ [✗ NO CONFORME - REPORTAR] │
│ │
│ [← Anterior] [Siguiente →] │
│ │
└──────────────────────────────┘

text

#### Marcar como CONFORME

1. Lee la instrucción cuidadosamente
2. Ejecuta la validación
3. Si todo es correcto → **"✓ Conforme"**
4. El sistema avanza al siguiente paso automáticamente

#### Marcar como NO CONFORME

1. Si encuentras un problema:
2. Haz clic en **"✗ No Conforme"**
3. **IMPORTANTE:** Describe el problema en "Notas"
   - ✅ Bueno: "Cable azul no conectado, falta terminal 24V"
   - ❌ Malo: "No funciona"
4. Haz clic en **"Reportar Problema"**
5. El ingeniero será notificado

**💡 Tip:** Sé específico en las notas para facilitar la resolución

#### Navegación

- **← Anterior:** Volver a validación previa (solo para revisar, no modificar)
- **Siguiente →:** Saltar validación (úsalo solo si necesitas revisar orden)

#### Progreso

- Barra superior muestra % completado
- Resumen muestra:
  - ✅ Conformes
  - ❌ No Conformes
  - ⏳ Pendientes

#### Finalizar Pedido

Cuando completes **TODAS** las validaciones:

1. El sistema te preguntará: **"¿Marcar pedido como completado?"**
2. Haz clic en **"Sí, finalizar"**
3. Estado cambia a **"Completado"**
4. Ya no podrás modificar validaciones

---

### 👑 ADMIN / INGENIERO: Revisar No Conformidades

#### Acceso a Revisión

1. Ve a **"Pedidos"**
2. Filtra por estado **"En Progreso"**
3. Busca pedidos con **indicador rojo** (tienen no conformidades)

#### Ver Detalles

1. Abre el pedido
2. Ve a la pestaña **"Validaciones"**
3. Filtra por **"No Conformes"**

**Información de cada no conformidad:**

┌────────────────────────────────────────────┐
│ ❌ NO CONFORME │
├────────────────────────────────────────────┤
│ Componente: Botonera CASIO X100 │
│ Validación: Verificar alimentación 24V DC │
│ │
│ 📝 Notas del operario: │
│ "Cable azul no conectado, falta terminal │
│ de 24V en bornero J3" │
│ │
│ 👤 Reportado por: Juan Pérez │
│ 📅 Fecha: 03/02/2026 14:35 │
│ │
│ [Marcar como Resuelto] │
└────────────────────────────────────────────┘

text

#### Acciones

**Opción 1: Resolver en campo**

1. Contacta con el operario
2. Indica cómo resolver el problema
3. El operario re-valida
4. Marca como **"Conforme"** cuando esté corregido

**Opción 2: Marcar como Resuelto**

1. Si el problema se resolvió fuera del sistema
2. Haz clic en **"Marcar como Resuelto"**
3. Añade nota explicativa

---

### 👑 ADMIN: Gestionar Base de Conocimiento

#### Subir Documentos Técnicos

**Documentos recomendados:**

- Manuales de instalación de componentes
- Esquemas eléctricos
- Normativas (EN 81-20, EN 81-50, UNE)
- Procedimientos internos de calidad
- Certificados de componentes

#### Proceso de Subida

1. Ve a **"Base de Conocimiento"**
2. Haz clic en **"📤 Subir Documento"**
3. Rellena:
   - **Título**: Nombre descriptivo
   - **Categoría**: Tipo de documento
   - **Versión**: Número de versión (opcional)
   - **Tags**: Palabras clave (ej: "casio", "botonera", "x100")
4. Arrastra el archivo PDF o haz clic para seleccionar
5. Espera a que suba (puede tardar 1-2 minutos si es grande)
6. Haz clic en **"Guardar"**

**Formatos aceptados:**

- ✅ PDF
- ✅ Imágenes (PNG, JPG) - se convertirán a PDF
- ❌ Word/Excel - convierte a PDF antes de subir

**Límites:**

- Tamaño máximo: **50 MB** por archivo
- Total en base: **Ilimitado** (depende del plan)

#### Organización

**Buenas prácticas:**

Categorías recomendadas:

Manuales de Componentes

Normativas

Esquemas Eléctricos

Procedimientos Internos

Certificados

Ejemplo de naming:
✅ "Manual_Botonera_CASIO_X100_v2.3.pdf"
✅ "Normativa_EN_81-20_2020.pdf"
❌ "documento.pdf"
❌ "manual (1).pdf"

text

#### Indexación IA

Cuando subes un documento:

1. Sistema extrae texto automáticamente
2. Divide en chunks de 500-1000 palabras
3. Genera embeddings vectoriales
4. Almacena en base de datos vectorial
5. Documento queda disponible para análisis IA

**Tiempo de indexación:**

- Documento pequeño (10 páginas): ~30 segundos
- Documento mediano (50 páginas): ~2 minutos
- Documento grande (200 páginas): ~5 minutos

---

## Preguntas Frecuentes

### General

**P: ¿Puedo usar el sistema sin internet?**
R: No, el sistema requiere conexión a internet para funcionar. El operario debe tener conexión en campo (WiFi o datos móviles).

**P: ¿Funciona en móvil?**
R: Sí, está optimizado para móvil y tablet. Recomendamos tablet para operarios en campo.

**P: ¿Qué navegadores son compatibles?**
R: Chrome, Firefox, Safari, Edge (versiones modernas). Recomendamos Chrome.

**P: ¿Se guardan automáticamente los datos?**
R: Sí, cada validación se guarda inmediatamente al marcarla como conforme/no conforme.

### Análisis IA

**P: ¿Cuánto tarda el análisis?**
R: Entre 2-5 minutos dependiendo de:
- Número de componentes (más componentes = más tiempo)
- Tamaño de la base de conocimiento
- Carga del sistema

**P: ¿Puedo analizar un pedido varias veces?**
R: Sí, pero **sobrescribirá las validaciones previas**. Úsalo solo si:
- Añadiste nuevos documentos a la base
- Cambiaste componentes del pedido
- Las validaciones previas eran incorrectas

**P: ¿Qué pasa si no encuentra información?**
R: Si la IA no encuentra documentación relevante:
- Generará validaciones genéricas básicas
- Te recomendará subir documentos específicos
- Puedes añadir validaciones manualmente

**P: ¿Puedo editar las validaciones generadas por IA?**
R: No directamente en esta versión. Si necesitas modificar:
- Añade una nota en el pedido
- O crea validaciones adicionales manualmente

### Operarios

**P: ¿Puedo volver atrás y cambiar una validación?**
R: No, una vez marcada como conforme/no conforme, queda registrada. Esto garantiza trazabilidad. Si cometiste un error, contacta a tu supervisor.

**P: ¿Qué hago si no entiendo una instrucción?**
R: 
1. Lee la fuente (documento técnico mencionado)
2. Contacta a tu supervisor
3. Si es un error, márcala como "No Conforme" y explica en notas

**P: ¿Puedo pausar y retomar más tarde?**
R: Sí, tu progreso se guarda automáticamente. Puedes cerrar sesión y continuar cuando quieras.

**P: ¿Qué pasa si pierdo conexión a internet mientras valido?**
R: Las validaciones **NO se guardarán** hasta que recuperes conexión. Asegúrate de tener conexión estable en campo.

### Administración

**P: ¿Cómo creo un nuevo usuario?**
R: (Solo Admin)
1. Ve a "Usuarios"
2. Haz clic en "+ Nuevo Usuario"
3. Rellena email, nombre, rol
4. El usuario recibirá email con credenciales

**P: ¿Puedo cambiar el rol de un usuario?**
R: Sí, en "Usuarios" → Editar → Cambiar Rol

**P: ¿Cuántos usuarios puedo tener?**
R: Depende de tu plan de suscripción. Contacta con soporte para ampliar.

**P: ¿Puedo exportar datos?**
R: Sí, cada pedido tiene opción "Exportar a PDF" con todo el registro de validaciones.

---

## Solución de Problemas

### No puedo iniciar sesión

**Síntomas:** Email/contraseña incorrectos

**Soluciones:**

1. Verifica que estás usando el email correcto (sensible a mayúsculas)
2. Verifica que no tienes Caps Lock activado
3. Haz clic en "¿Olvidaste tu contraseña?" para resetear
4. Contacta con tu administrador si el problema persiste

### El análisis IA falla o se queda colgado

**Síntomas:** Análisis no termina después de 10 minutos

**Soluciones:**

1. Recarga la página y vuelve a intentar
2. Verifica que hay documentos en la base de conocimiento
3. Reduce el número de componentes del pedido (divide en 2 pedidos)
4. Contacta con soporte técnico

### No veo mi tarea asignada (Operario)

**Síntomas:** Dashboard muestra "Sin tareas asignadas"

**Posibles causas:**

1. El ingeniero aún no te asignó ninguna tarea
2. Ya completaste tu tarea anterior
3. El pedido está en estado incorrecto

**Soluciones:**

1. Contacta con tu supervisor
2. Verifica que tienes el rol "Operario"
3. Cierra sesión y vuelve a entrar

### Error al subir documento

**Síntomas:** "Error al subir archivo" o archivo no aparece

**Soluciones:**

1. Verifica que el archivo es PDF o imagen (PNG/JPG)
2. Verifica que el tamaño < 50 MB
3. Verifica tu conexión a internet
4. Intenta con otro navegador
5. Convierte el archivo a PDF y vuelve a intentar

### Validaciones no se guardan

**Síntomas:** Al marcar conforme/no conforme no avanza o da error

**Soluciones:**

1. Verifica tu conexión a internet
2. Recarga la página (tu progreso se guarda automáticamente)
3. Si marcaste "No Conforme", verifica que añadiste notas
4. Cierra sesión y vuelve a entrar
5. Contacta con soporte si persiste

### Rendimiento lento

**Síntomas:** El sistema va muy lento, tarda en cargar

**Soluciones:**

1. Cierra pestañas innecesarias del navegador
2. Limpia caché del navegador:
   - Chrome: Ctrl+Shift+Del → Borrar datos
3. Verifica tu conexión a internet (min. 3 Mbps recomendado)
4. Actualiza tu navegador a la última versión
5. Intenta desde otro dispositivo

---

## Contacto y Soporte

### Soporte Técnico

**Email:** soporte@tuempresa.com
**Teléfono:** +34 XXX XXX XXX
**Horario:** Lunes a Viernes, 9:00 - 18:00 CET

### Recursos Adicionales

- 📹 **Videotutoriales:** [enlace]
- 📚 **Base de conocimiento:** [enlace]
- 💬 **Chat en vivo:** Disponible en el sistema (icono abajo derecha)

### Reportar un Bug

Si encuentras un error del sistema:

1. Toma captura de pantalla
2. Anota pasos para reproducir el error
3. Envía email a: bugs@tuempresa.com
4. Incluye:
   - Navegador y versión
   - Dispositivo (PC/móvil/tablet)
   - Descripción detallada
   - Captura de pantalla

---

## Changelog

### Versión 1.0.0 (Febrero 2026)

- ✅ Sistema de pedidos y componentes
- ✅ Análisis con IA (GPT-4)
- ✅ Validaciones paso a paso para operarios
- ✅ Base de conocimiento con RAG
- ✅ Roles y permisos
- ✅ Dashboard y analítica básica

### Próximas funcionalidades (Roadmap)

- 📸 **Fotos de evidencia** en validaciones (Q2 2026)
- 📊 **Analítica avanzada** con gráficos (Q2 2026)
- 🔔 **Notificaciones push** en móvil (Q3 2026)
- 📱 **App móvil nativa** (Q3 2026)
- 🗣️ **Validación por voz** (Q4 2026)

---

**Última actualización:** 03/02/2026
**Versión del manual:** 1.0.0