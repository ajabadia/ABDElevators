# 💳 FASE 9.1: MOTOR DE FACTURACIÓN AVANZADA (DYNAMIC PRICING ENGINE)

## 🎯 OBJETIVO
Implementar un sistema de tarificación flexible y escalable que permita parametrizar costes de forma general y personalizada por cliente (tenant), soportando modelos de negocio complejos (Tiers, Rappels, Overage).

---

## 🏗️ ARQUITECTURA DEL MOTOR

### 1. Modelos de Tarificación Soportados

| Modelo | Lógica | Ejemplo |
|--------|--------|---------|
| **FIXED** | Precio constante por cada unidad. | 1.00€ por informe. |
| **TIERED (Escalas)** | El precio cambia por tramos consumidos. | 0-100: 1€, 101-500: 0.90€. |
| **RAPPEL (Directo)** | Al llegar a X unidades, TODAS pasan a un nuevo precio. | Si haces >100, todos los informes cuestan 0.90€. |
| **RAPPEL_INVERSE** | El precio sube al aumentar el volumen. | >500 unidades: todas a 1.20€ (infra stress fee). |
| **FLAT_FEE_OVERAGE** | Cuota fija que incluye N unidades, el resto se paga aparte. | 100€/mes (incluye 100), extra a 1.10€. |

---

### 2. Estructura de Datos (Schemas)

#### **GlobalPricingPlan (Colección: `pricing_plans`)**
Define las tarifas estandár de la plataforma.
```typescript
{
  _id: ObjectId,
  name: "Plan Estándar",
  isDefault: true,
  metrics: {
    REPORTS: {
      type: 'TIERED',
      currency: 'EUR',
      tiers: [
        { from: 0, to: 100, unitPrice: 1.00 },
        { from: 101, to: 500, unitPrice: 0.90 },
        { from: 501, to: null, unitPrice: 0.80 }
      ]
    },
    API_CALLS: {
      type: 'FIXED',
      unitPrice: 0.05
    },
    STORAGE_GB: {
      type: 'FLAT_FEE_OVERAGE',
      baseFee: 50,
      includedUnits: 10,
      overagePrice: 5
    }
  }
}
```

#### **TenantBillingConfig (Colección: `tenant_billing`)**
Permite heredar del global o sobreescribir métricas específicas.
```typescript
{
  tenantId: "tenant_abc_123",
  overrides: {
    REPORTS: {
      type: 'RAPPEL', // Negociación especial para este cliente
      currency: 'EUR',
      thresholds: [
        { minUnits: 0, price: 1.00 },
        { minUnits: 1000, price: 0.70 } // Si llega a 1000, todos a 0.70
      ]
    }
  },
  billingDay: 1, // Día del mes para el cierre
  paymentMethod: "STRIPE"
}

#### **PromoCodes & Credits (Colección: `billing_promo_codes`)**
Sistema de incentivos y cortesía profesional.
```typescript
{
  code: "WELCOME2026",
  type: "PERCENTAGE_DISCOUNT" | "FIXED_AMOUNT" | "FREE_UNITS",
  value: 20, // 20% o 20€ o 20 unidades
  metric?: "REPORTS" | "API_CALLS", // Si es FREE_UNITS, a qué aplica
  expiresAt: Date,
  maxRedemptions: 100,
  redemptionsCount: 5,
  stackable: false // Si se puede usar con otros códigos
}
```

#### **TenantCredits (Colección: `tenant_credits`)**
Saldo de cortesía inyectado manualmente o vía código.
```typescript
{
  tenantId: "tenant_abc",
  metric: "REPORTS",
  balance: 50, // 50 informes gratis restantes
  source: "GIFT_CODE" | "MANUAL_ADJUSTMENT",
  reason: "Cortesía por incidencia técnica",
  expiryDate: Date
}
```
```

---

### 3. Lógica del Calculador (Billing Engine)

El motor debe calcular el coste acumulado en el ciclo actual basándose en los `UsageLogs`.

```typescript
/**
 * Lógica mejorada con Créditos y Promociones
 */
function calculateFinalProvision(usage: number, config: PricingConfig, credits: number): BillingResult {
  // 1. Consumir créditos de cortesía primero
  const billableUsage = Math.max(0, usage - credits);
  const unitsFromCredits = usage - billableUsage;

  // 2. Calcular coste base según modelo (TIERED, RAPPEL, etc.)
  let baseCost = calculateBaseCost(billableUsage, config);

  // 3. Aplicar descuentos de Promo Codes si existen (PERCENTAGE o FIXED)
  // ... (lógica de descuentos sobre baseCost)

  return {
    totalCost: baseCost,
    details: {
      totalUsage: usage,
      coveredByCredits: unitsFromCredits,
      billableUsage: billableUsage
    }
  };
}

function calculateBaseCost(units: number, config: PricingConfig): number {
  switch (config.type) {
    case 'FIXED':
      return units * config.unitPrice;

    case 'TIERED':
      // Se calcula por tramos (segmentado)
      return config.tiers.reduce((total, tier) => {
        if (units <= tier.from) return total;
        const calculableUnits = tier.to 
          ? Math.min(units, tier.to) - tier.from 
          : units - tier.from;
        return total + (calculableUnits * tier.unitPrice);
      }, 0);

    case 'RAPPEL':
      // El precio se determina por la mayor escala alcanzada
      const applicablePrice = [...config.thresholds]
        .sort((a, b) => b.minUnits - a.minUnits)
        .find(t => units >= t.minUnits)?.price;
      return units * applicablePrice;

    case 'FLAT_FEE_OVERAGE':
      const extra = Math.max(0, units - config.includedUnits);
      return config.baseFee + (extra * config.overagePrice);

    default:
      return 0;
  }
}
```

---

### 4. Flujo de Trabajo (Workflow)

1. **Trackeo (Tiempo Real):** Cada vez que se genera un informe, se registra en `usage_logs`.
2. **Consultoría de Precios:** El sistema busca si el tenant tiene un `override` en `tenant_billing`. Si no, usa el `GlobalPricingPlan`.
3. **Dashboard de Cliente:** El cliente ve su "Gasto Proyectado" basado en su volumen actual y su modelo específico.
4. **Cierre Mensual:** El sistema congela los logs del mes, aplica el motor de facturación y genera la factura/cargo en Stripe.

---

### 5. Interfaz SuperAdmin (Control Total)

El SuperAdmin tendrá un panel avanzado para cada tenant donde podrá:
- **Ver modelo actual:** "Heredado de Global" o "Personalizado".
- **Botón "Personalizar Tarifa":** Abre un editor para definir Tiers o Rappels específicos para ese cliente.
- **Simulador:** "Si este cliente consume 1200 informes, ¿cuánto le cobraremos con esta nueva tarifa?"

---

## 🚀 BENEFICIOS PARA EL NEGOCIO

- **Fidelización:** Facilita negociaciones con grandes cuentas (Rappels).
- **Escalabilidad:** El sistema de herencia evita configurar mil tarifas iguales.
- **Transparencia:** El cliente siempre sabe qué modelo se le está aplicando.
- **Flexibilidad de Mercado:** Permite lanzar promociones (ej: "Primeros 50 informes gratis") simplemente ajustando los Tiers.

---

**Diseñado por:** Antigravity AI  
**Fecha:** 23 de Enero de 2026  
**Fase:** 9.1 - Billing Strategy & Pricing Engine
