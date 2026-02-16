# Configuración de Neo4j AuraDB (Free Tier) en Vercel

Sigue estos pasos para conectar tu instancia gratuita de Neo4j con tu despliegue en Vercel.

## 1. Obtener Credenciales de Neo4j Aura

1. Inicia sesión en [Neo4j Aura Console](https://console.neo4j.io/).
2. Si no tienes una instancia, crea una nueva (Free Tier).
3. **IMPORTANTE**: Cuando creas la instancia, se te mostrará un archivo `.txt` con las credenciales. **Guarda la contraseña**, ya que no podrás verla de nuevo (tendrías que resetearla).
4. Una vez creada, verás tu instancia en el dashboard.
5. Copia el **Connection URI** (ej: `neo4j+s://xxxxxxxx.databases.neo4j.io`).

## 2. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en el [Vercel Dashboard](https://vercel.com/dashboard).
2. Navega a **Settings** > **Environment Variables**.
3. Añade las siguientes variables (puedes copiarlas una por una o usar el modo raw):

| Variable | Valor (Ejemplo) | Descripción |
|---|---|---|
| `NEO4J_URI` | `neo4j+s://xxxxxxxx.databases.neo4j.io` | URI de conexión segura (`+s` es importante para Aura). |
| `NEO4J_USERNAME` | `neo4j` | Usuario por defecto (suele ser `neo4j`). |
| `NEO4J_PASSWORD` | `tu_contraseña_secreta` | La contraseña que guardaste al crear la instancia. |

> **Nota**: Asegúrate de desmarcar las opciones de "Preview" o "Development" si solo quieres que aplique a producción, aunque generalmente querrás que esté disponible en ambos entornos si es tu base de datos principal.

## 3. Verificar Conexión

Una vez añadidas las variables, necesitas hacer un **Redeploy** para que la aplicación las tome.

1. Ve a la pestaña **Deployments** en Vercel.
2. En el último despliegue, haz clic en los tres puntos (...) y selecciona **Redeploy**.
3. Una vez termine, navega a `/admin/knowledge-base/graph`.

Si la conexión falla, verás un error de autenticación o timeout en los logs de Vercel (Pestaña "Logs").
