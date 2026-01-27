# 🚀 GUÍA DE CONFIGURACIÓN: STRIPE + RESEND + VERCEL

**Duración estimada:** 1 hora  
**Dificultad:** Media  
**Requisitos:** Tarjeta de crédito para Stripe (modo test no requiere)

---

## 📋 CHECKLIST RÁPIDO

- [ ] Configurar Stripe Dashboard
- [ ] Configurar Resend
- [ ] Añadir variables de entorno en Vercel
- [ ] Verificar deployment
- [ ] Testing en producción

---

## 1️⃣ CONFIGURACIÓN DE STRIPE (30 minutos)

### Paso 1.1: Crear Cuenta Stripe

1. Ve a https://dashboard.stripe.com/register
2. Completa el formulario de registro
3. Verifica tu email
4. **IMPORTANTE:** Por ahora usa **Test Mode** (toggle en la esquina superior derecha)

### Paso 1.2: Crear Productos

#### Producto 1: ABD RAG Platform - Professional

1. En el dashboard, ve a **Products** → **Add product**
2. Completa:
   - **Name:** `ABD RAG Platform - Professional`
   - **Description:** `Plan profesional con 1M tokens/mes, 5GB storage, 10k búsquedas`
   - **Pricing model:** `Standard pricing`
   - **Price:** `99.00 USD`
   - **Billing period:** `Monthly`
   - Click **Add pricing** para añadir precio anual:
     - **Price:** `990.00 USD` (equivalente a $82.50/mes, 17% descuento)
     - **Billing period:** `Yearly`
3. Click **Save product**
4. **COPIAR LOS PRICE IDs:**
   - En la página del producto, verás los precios listados
   - Click en cada precio y copia el `price_id` (empieza con `price_`)
   - Ejemplo: `price_1OabcdEF12345678` (mensual), `price_1OxyzAB87654321` (anual)

#### Producto 2: ABD RAG Platform - Enterprise

1. **Products** → **Add product**
2. Completa:
   - **Name:** `ABD RAG Platform - Enterprise`
   - **Description:** `Plan enterprise con recursos ilimitados y soporte prioritario`
   - **Pricing model:** `Standard pricing`
   - **Price:** `499.00 USD`
   - **Billing period:** `Monthly`
   - Click **Add pricing** para añadir precio anual:
     - **Price:** `4990.00 USD` (equivalente a $415.83/mes, 17% descuento)
     - **Billing period:** `Yearly`
3. Click **Save product**
4. **COPIAR LOS PRICE IDs** (igual que antes)

### Paso 1.3: Configurar Webhook

1. En el dashboard, ve a **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Completa:
   - **Endpoint URL:** `https://abd-elevators.vercel.app/api/webhooks/stripe`
   - **Description:** `ABD RAG Platform - Production Webhook`
   - **Events to send:** Click **Select events**
   - Selecciona estos eventos:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
4. Click **Add endpoint**
5. **COPIAR EL SIGNING SECRET:**
   - En la página del webhook, verás **Signing secret**
   - Click **Reveal** y copia el valor (empieza con `whsec_`)

### Paso 1.4: Obtener API Keys

1. Ve a **Developers** → **API keys**
2. **COPIAR:**
   - **Publishable key:** Empieza con `pk_test_` (test) o `pk_live_` (producción)
   - **Secret key:** Click **Reveal** y copia (empieza con `sk_test_` o `sk_live_`)

### Paso 1.5: Resumen de Valores Stripe

Deberías tener ahora **10 valores**:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Pro Monthly
STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...

# Pro Yearly
STRIPE_PRICE_PRO_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...

# Enterprise Monthly
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...

# Enterprise Yearly
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

---

## 2️⃣ CONFIGURACIÓN DE RESEND (15 minutos)

### Paso 2.1: Crear Cuenta Resend

1. Ve a https://resend.com/signup
2. Completa el formulario de registro
3. Verifica tu email

### Paso 2.2: Verificar Dominio (OPCIONAL - Recomendado)

**OPCIÓN A: Usar dominio propio (abdrag.com)**

1. En el dashboard, ve a **Domains** → **Add Domain**
2. Ingresa tu dominio: `abdrag.com`
3. Copia los registros DNS que te proporciona Resend
4. Ve a tu proveedor de DNS (GoDaddy, Cloudflare, etc.)
5. Añade los registros DNS:
   - **TXT record** para verificación
   - **MX records** para recepción (opcional)
   - **DKIM records** para autenticación
6. Espera 24-48 horas para propagación
7. Click **Verify domain** en Resend

**OPCIÓN B: Usar dominio de Resend (más rápido)**

1. Usa el dominio por defecto: `onboarding.resend.dev`
2. **Limitación:** Solo puedes enviar a emails verificados
3. Para testing está bien, pero para producción usa dominio propio

### Paso 2.3: Obtener API Key

1. En el dashboard, ve a **API Keys** → **Create API Key**
2. Completa:
   - **Name:** `ABD RAG Platform - Production`
   - **Permission:** `Sending access`
3. Click **Create**
4. **COPIAR LA API KEY** (empieza con `re_`)
   - ⚠️ **IMPORTANTE:** Solo se muestra una vez, guárdala en lugar seguro

### Paso 2.4: Configurar Email Remitente

Si usas dominio propio:
```
RESEND_FROM_EMAIL=ABD RAG Platform <noreply@abdrag.com>
```

Si usas dominio de Resend:
```
RESEND_FROM_EMAIL=ABD RAG Platform <onboarding@resend.dev>
```

### Paso 2.5: Resumen de Valores Resend

Deberías tener ahora **2 valores**:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ABD RAG Platform <noreply@abdrag.com>
```

---

## 3️⃣ CONFIGURACIÓN DE VERCEL (10 minutos)

### Paso 3.1: Acceder a Variables de Entorno

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto: `abd-elevators`
3. Ve a **Settings** → **Environment Variables**

### Paso 3.2: Añadir Variables de Stripe

Click **Add** para cada variable:

| Key | Value | Environment |
|-----|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Production, Preview, Development |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | `price_...` | Production, Preview, Development |
| `STRIPE_PRICE_PRO_YEARLY` | `price_...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` | `price_...` | Production, Preview, Development |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | `price_...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY` | `price_...` | Production, Preview, Development |
| `STRIPE_PRICE_ENTERPRISE_YEARLY` | `price_...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY` | `price_...` | Production, Preview, Development |

### Paso 3.3: Añadir Variables de Resend

| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_...` | Production, Preview, Development |
| `RESEND_FROM_EMAIL` | `ABD RAG Platform <noreply@abdrag.com>` | Production, Preview, Development |

### Paso 3.4: Verificar URL de la App

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://abd-elevators.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://abd-elevators-git-[branch].vercel.app` | Preview |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

### Paso 3.5: Redeploy

1. Ve a **Deployments**
2. Click en el último deployment
3. Click **⋯** (tres puntos) → **Redeploy**
4. Espera a que termine el deployment (~2 minutos)

---

## 4️⃣ VERIFICACIÓN (10 minutos)

### Paso 4.1: Verificar Landing Page

1. Abre https://abd-elevators.vercel.app/
2. ✅ Debe cargar sin pedir login
3. ✅ Navega a `/privacy`, `/terms`, `/arquitectura`
4. ✅ Todos deben ser accesibles públicamente

### Paso 4.2: Verificar Página de Upgrade

1. Navega a https://abd-elevators.vercel.app/upgrade
2. ✅ Debe mostrar los 3 planes (Free, Pro, Enterprise)
3. ✅ Toggle mensual/anual debe funcionar
4. ✅ Precios deben mostrarse correctamente

### Paso 4.3: Testing de Checkout (Modo Test)

1. En `/upgrade`, click **Actualizar a Professional**
2. ✅ Debe redirigir a Stripe Checkout
3. Usa tarjeta de prueba:
   - **Número:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/34)
   - **CVC:** Cualquier 3 dígitos (ej: 123)
   - **ZIP:** Cualquier código postal
4. Completa el pago
5. ✅ Debe redirigir a `/admin/billing?success=true`
6. ✅ Verifica en Stripe Dashboard → **Payments** que el pago aparece

### Paso 4.4: Verificar Webhook

1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Click en tu webhook
3. Ve a **Attempts**
4. ✅ Debe mostrar eventos recibidos (subscription.created, payment.succeeded)
5. ✅ Status debe ser `200 OK`

### Paso 4.5: Testing de Email (Opcional)

**OPCIÓN A: Si tienes dominio verificado**
1. Simula consumo al 80% en MongoDB
2. Haz un request que consuma tokens
3. ✅ Deberías recibir email de alerta

**OPCIÓN B: Si usas dominio de Resend**
1. En Resend Dashboard, ve a **Emails** → **Add email**
2. Añade tu email personal
3. Verifica el email
4. Ahora puedes recibir emails de prueba

---

## 5️⃣ TROUBLESHOOTING

### Problema: Webhook no funciona

**Síntomas:** En Stripe Dashboard, webhook muestra errores 500 o timeout

**Soluciones:**
1. Verifica que la URL del webhook es correcta: `https://abd-elevators.vercel.app/api/webhooks/stripe`
2. Verifica que `STRIPE_WEBHOOK_SECRET` está configurado en Vercel
3. Verifica logs en Vercel Dashboard → **Logs**
4. Prueba el webhook con Stripe CLI:
   ```bash
   stripe trigger customer.subscription.created
   ```

### Problema: Checkout no redirige

**Síntomas:** Después de pagar, no redirige a `/admin/billing`

**Soluciones:**
1. Verifica que `NEXT_PUBLIC_APP_URL` está configurado correctamente
2. Verifica que los `price_id` son correctos
3. Revisa logs en Vercel

### Problema: Email no se envía

**Síntomas:** No recibes emails de alerta

**Soluciones:**
1. Verifica que `RESEND_API_KEY` está configurado
2. Verifica que el dominio está verificado (o usa dominio de Resend)
3. Verifica que el email del admin está en la base de datos
4. Revisa logs en Resend Dashboard → **Logs**

### Problema: Variables de entorno no se aplican

**Síntomas:** Después de añadir variables, no funcionan

**Soluciones:**
1. Asegúrate de hacer **Redeploy** después de añadir variables
2. Verifica que las variables están en el environment correcto (Production)
3. Espera 1-2 minutos después del redeploy

---

## 6️⃣ PASAR A PRODUCCIÓN (LIVE MODE)

⚠️ **IMPORTANTE:** Solo cuando estés listo para cobrar dinero real

### Paso 6.1: Activar Live Mode en Stripe

1. En Stripe Dashboard, toggle **Test mode** → **Live mode**
2. Completa el formulario de activación de cuenta:
   - Información de la empresa
   - Información bancaria (para recibir pagos)
   - Verificación de identidad
3. Espera aprobación (1-2 días hábiles)

### Paso 6.2: Recrear Productos en Live Mode

1. Repite los pasos 1.2 (crear productos) en Live mode
2. **COPIAR LOS NUEVOS PRICE IDs** (serán diferentes)

### Paso 6.3: Recrear Webhook en Live Mode

1. Repite el paso 1.3 (configurar webhook) en Live mode
2. **COPIAR EL NUEVO SIGNING SECRET**

### Paso 6.4: Actualizar Variables en Vercel

1. Reemplaza todas las variables de Stripe con las de Live mode:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (nuevo)
   - Todos los `price_id` → nuevos IDs de Live mode
2. **Redeploy**

### Paso 6.5: Testing Final

1. Haz un pago de prueba con tarjeta real (puedes cancelar después)
2. Verifica que todo funciona
3. Cancela la suscripción de prueba si es necesario

---

## ✅ CHECKLIST FINAL

- [ ] Stripe configurado (productos, webhook, API keys)
- [ ] Resend configurado (API key, dominio verificado)
- [ ] Variables de entorno en Vercel (13 variables)
- [ ] Redeploy completado
- [ ] Landing page accesible sin login
- [ ] Página de upgrade funcional
- [ ] Checkout flow funciona (test mode)
- [ ] Webhook recibe eventos correctamente
- [ ] Emails se envían (opcional en test)
- [ ] Documentación leída

---

## 📞 SOPORTE

### Recursos
- **Stripe:** https://support.stripe.com
- **Resend:** https://resend.com/docs
- **Vercel:** https://vercel.com/docs

### Contacto
- **Email:** support@abdrag.com
- **Documentación:** Ver archivos `FASE_9.*.md`

---

**¡Listo!** Tu plataforma SaaS está configurada y lista para empezar a cobrar 🚀
