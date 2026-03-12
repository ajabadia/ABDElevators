# Procedimiento de Gestión de Incidentes de Seguridad

## 1. Objetivo
Establecer un proceso claro y repetible para gestionar incidentes de seguridad de la información y minimizar su impacto.

## 2. Alcance
Aplica a cualquier incidente que afecte o pueda afectar a sistemas, aplicaciones, infraestructuras o datos gestionados por la plataforma.

## 3. Roles
- **Responsable de Seguridad**: coordina la gestión del incidente y toma decisiones clave.
- **Responsables Técnicos**: analizan causas, aplican medidas de contención, erradicación y recuperación.
- **Dirección**: decide sobre comunicaciones externas críticas.

## 4. Fases del Proceso

### 4.1 Detección y notificación
Cualquier persona que detecte un incidente real o sospecha deberá notificarlo de inmediato (email, ticket o canal interno).

### 4.2 Registro y clasificación
Todo incidente se registrará en `records/incident-log.md`. Se clasificará por Tipo y Severidad (Baja, Media, Alta, Crítica).

### 4.3 Análisis y contención
El equipo técnico analizará el alcance y aplicará medidas de contención proporcionales (bloqueo de cuentas, aislamiento de sistemas).

### 4.4 Erradicación y recuperación
Identificación de causas raíz y aplicación de medidas definitivas (parches, limpieza de malware). Restauración de servicios y datos.

### 4.5 Comunicación
Se definirá si el incidente requiere comunicación externa (clientes, autoridades) según plazos legales y contractuales.

### 4.6 Cierre y lecciones aprendidas
Se realizará un post-mortem documentado con la línea de tiempo, causa raíz y plan de acciones de mejora.

## 5. Revisión
Este procedimiento se revisará al menos una vez al año o tras un incidente crítico.
