# Guía de Importación Masiva de Usuarios - ABDElevators

Esta guía detalla el formato necesario para importar usuarios de forma masiva en la plataforma ABDElevators.

## 📋 Requisitos del Archivo

Se admiten archivos en formato **CSV** (archivo de valores separados por comas) y **Excel (XLSX)**.

### Estructura de Columnas

El archivo debe tener los siguientes encabezados en la primera fila:

| Columna | Obligatorio | Descripción | Valores Permitidos |
| :--- | :--- | :--- | :--- |
| **email** | Sí | Correo electrónico del usuario a invitar. | Formato de email válido. |
| **role** | No | Rol que se asignará al usuario. | `TECHNICAL`, `ENGINEERING`, `ADMIN`, `ADMINISTRATIVE` |

> [!NOTE]
> Si no se especifica la columna `role`, el sistema asignará automáticamente el rol `TECHNICAL` por defecto.

## 🎭 Roles y Permisos

- **ADMIN**: Administrador con control total sobre el Tenant.
- **TECHNICAL**: Perfil técnico con acceso a análisis y reportes.
- **ENGINEERING**: Perfil de ingeniería enfocado en proyectos.
- **ADMINISTRATIVE**: Personal de soporte y administración con permisos limitados.

## 💡 Mejores Prácticas

1. **Codificación**: Si utiliza CSV, asegúrese de guardar el archivo con codificación **UTF-8** para evitar problemas con caracteres especiales.
2. **Delimitadores**: En archivos CSV, utilice la **coma (,)** como separador. Si su Excel usa punto y coma por configuración regional, asegúrese de cambiarlo antes de exportar.
3. **Prueba Inicial**: Si planea invitar a cientos de usuarios, pruebe primero con un archivo de 2-3 filas para verificar que el mapeo de roles es el deseado.
4. **Duplicados**: El sistema omitirá automáticamente emails que ya tengan una cuenta activa o una invitación pendiente.
5. **Previsualización**: Antes de enviar, el modal mostrará una lista de las filas detectadas y marcará en rojo aquellas con errores de formato.

## 📄 Ejemplo de Archivo (CSV)

```csv
email,role
ingeniero@empresa.com,ENGINEERING
tecnico@empresa.com,TECHNICAL
admin.local@empresa.com,ADMIN
soporte@empresa.com,ADMINISTRATIVE
```

---
© 2026 ABDElevators Platform - Todos los derechos reservados.
