# Apéndice Técnico: Flujo de Autenticación y Sesión

## 1. Propósito
Describir los controles implementados para la identificación, autenticación y autorización segura.

## 2. Componentes
- **NextAuth (v5 beta)**: Gestión de identidades y ciclo de vida de sesión.
- **MFA Enforcement**: Capa obligatoria para roles privilegiados.
- **Guardian Engine**: Motor ABAC para autorización fina.

## 3. Flujo de Autenticación
1. **Identificación**: Email/Contraseña.
2. **MFA**: Si está activo, el middleware redirige a verificación TOTP.
3. **Session Context**: Creación de objeto `TenantSession` con `userId`, `tenantId` y `role`.
4. **Token Security**: Tokens JWE/JWT firmados con rotación de claves.

## 4. Autorización (Guardian V3)
Se utiliza el helper `requirePermission(resource, action)` en Server Components y API Routes.
Cada denegación genera un log `PERMISSION_DENIED` con el `correlationId` para auditoría.

## 5. Control de Sesión
- **Timeout**: Expiración por inactividad.
- **Revocación**: Capacidad de invalidar sesiones por `userId` o `sessionId` ante incidentes.
- **Unique IDs**: Uso de `EntityIdSchema` (Zod Branded) para IDs de usuario.
