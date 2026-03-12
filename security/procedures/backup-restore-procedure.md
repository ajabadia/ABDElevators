# Procedimiento de Backup y Restauración

## 1. Objetivo
Garantizar la disponibilidad y recuperabilidad de los datos de la plataforma ante fallos catastróficos o errores humanos.

## 2. Alcance
Aplica a todas las bases de datos de producción (MongoDB Atlas) y archivos persistentes (GridFS/Cloudinary).

## 3. Estrategia de Backup
- **MongoDB Atlas**: Backups continuos con snapshots diarios y retención de 30 días.
- **Configuración**: Se utiliza "Cloud Backup" nativo de Atlas con replicación en múltiples regiones.

## 4. Procedimiento de Restauración (Drill)

### 4.1 Restauración de Base de Datos
1. Identificar el punto de restauración (PIT) requerido.
2. Usar la consola de MongoDB Atlas para "Restore to a new cluster" (para pruebas) o en el actual (emergencia).
3. Verificar la integridad de los datos tras la restauración.

### 4.2 Restauración de Archivos
1. Recuperar archivos desde el sistema de versionado o backups de GridFS si aplica.

## 5. Pruebas Anuales (Restoration Test)
Se debe realizar al menos una prueba de restauración anual, documentando el resultado en `records/backup-restore-tests-log.md`.
- **RTO Objetivo**: < 4 horas.
- **RPO Objetivo**: < 1 hora.

## 6. Revisión
Revisión semestral de la configuración de backup.
