# 📋 FASE 6.6.1: GESTIÓN AVANZADA DE INFORMES LLM

## 🎯 OBJETIVO

Implementar un sistema profesional de gestión de informes LLM con control de costos, almacenamiento persistente, auditoría completa y mejores prácticas SaaS enterprise.

---

## 🔑 REQUISITOS CLAVE

### 1. **Control de Costos por Tenant**

**Problema:** La generación de informes consume tokens de Gemini (costo real en USD). Los tenants deben poder controlar este gasto.

**Solución:**

```typescript
// Schema Extension: Tenant
features: {
  llmReports: {
    enabled: boolean,                    // Feature flag principal
    monthlyLimit: number,                // DEFAULT: 10 (configurable por SUPER_ADMIN)
                                         // Ejemplos: 5 (Free Trial), 10 (Basic), 50 (Pro), -1 (Unlimited Enterprise)
    requireApproval: boolean,            // Si true, ADMIN debe aprobar antes de generar
    maxTokensPerReport: number,          // Límite de tokens por informe (ej: 2000)
    costAlertThreshold: number,          // Alertar si costo mensual > X USD
    allowedRoles: ['ADMIN', 'TECNICO'],  // Roles que pueden generar informes
    customNotes?: string                 // Notas del SUPER_ADMIN sobre negociación especial
  }
}

// Valores por defecto al crear tenant
const DEFAULT_LLM_REPORT_CONFIG = {
  enabled: true,
  monthlyLimit: 10,              // ⭐ Estándar configurable
  requireApproval: false,
  maxTokensPerReport: 2000,
  costAlertThreshold: 50,        // USD
  allowedRoles: ['ADMIN', 'TECNICO']
};
```

**UI de Configuración (Solo SUPER_ADMIN):**

Página: `/admin/tenants/[id]/features`

```tsx
<Card>
  <CardHeader>
    <CardTitle>Límites de Informes LLM</CardTitle>
    <CardDescription>
      Configura los límites de generación de informes para este tenant
    </CardDescription>
  </CardHeader>
  <CardContent>
    <FormField label="Límite Mensual de Informes">
      <Input 
        type="number" 
        value={monthlyLimit}
        onChange={setMonthlyLimit}
        placeholder="10 (por defecto)"
      />
      <FormDescription>
        Número máximo de informes que puede generar este tenant por mes.
        Usa -1 para ilimitado (Enterprise).
      </FormDescription>
    </FormField>
    
    <FormField label="Requiere Aprobación">
      <Switch 
        checked={requireApproval}
        onCheckedChange={setRequireApproval}
      />
      <FormDescription>
        Si está activado, los informes requieren aprobación del ADMIN antes de generarse.
      </FormDescription>
    </FormField>
    
    <FormField label="Notas de Negociación">
      <Textarea
        value={customNotes}
        onChange={setCustomNotes}
        placeholder="Ej: Cliente Premium - límite aumentado a 50 por acuerdo comercial"
      />
    </FormField>
  </CardContent>
  <CardFooter>
    <Button onClick={handleSave}>Guardar Configuración</Button>
  </CardFooter>
</Card>
```

**Flujo de Validación:**
1. Usuario hace clic en "Generar Informe"
2. Sistema verifica:
   - ✅ Feature habilitado para el tenant
   - ✅ Usuario tiene rol permitido
   - ✅ No se ha excedido límite mensual
   - ✅ Estimación de tokens < maxTokensPerReport
3. Si `requireApproval = true`:
   - Crear solicitud pendiente
   - Notificar a ADMIN
   - ADMIN aprueba/rechaza
4. Generar informe

---

### 2. **Almacenamiento Persistente en Cloudinary**

**Estructura de Carpetas:**
```
/{tenantId}/
  └── informes/
      └── {pedidoId}/
          ├── informe-v1-{timestamp}.pdf
          ├── informe-v2-{timestamp}.pdf
          └── informe-v3-{timestamp}.pdf
```

**Metadata Tags (Cloudinary):**
```javascript
{
  resource_type: 'raw',
  folder: `${tenantId}/informes/${pedidoId}`,
  public_id: `informe-v${version}-${timestamp}`,
  tags: [
    `tenant:${tenantId}`,
    `pedido:${pedidoId}`,
    `version:${version}`,
    `generatedBy:${userId}`,
    `type:llm-report`
  ],
  context: {
    pedidoId,
    version,
    tokensUsed,
    costUSD,
    generatedBy: userName
  }
}
```

**Ventajas:**
- ✅ Versionado automático (v1, v2, v3...)
- ✅ Búsqueda por tags
- ✅ Transformaciones (thumbnail, watermark)
- ✅ CDN global (descarga rápida)
- ✅ Retención configurable (TTL)

---

### 3. **Schema de Informes (MongoDB)**

```typescript
// Collection: informes_llm
{
  _id: ObjectId,
  pedidoId: string,
  tenantId: string,
  version: number,                      // Auto-increment (1, 2, 3...)
  
  // Generación
  generadoPor: userId,
  nombreTecnico: string,
  aprobadoPor?: userId,                 // Si requireApproval = true
  solicitudAprobacion?: {
    solicitadoAt: Date,
    aprobadoAt?: Date,
    rechazadoAt?: Date,
    razonRechazo?: string
  },
  
  // Contenido
  contenidoMarkdown: string,            // Texto original del LLM
  pdfUrl: string,                       // Cloudinary URL (público con signed URL)
  pdfCloudinaryId: string,
  thumbnailUrl: string,                 // Preview del PDF
  
  // Metadata Técnica
  metadata: {
    modelo: 'gemini-2.0-flash-exp',
    tokensUsados: number,
    costoUSD: number,                   // Calculado según pricing de Gemini
    temperatura: number,
    duracionMs: number,
    promptLength: number,
    responseLength: number
  },
  
  // Estado
  estado: 'DRAFT' | 'APPROVED' | 'ARCHIVED',
  timestamp: Date,
  archivedAt?: Date,
  archivedBy?: userId,
  
  // Auditoría
  downloadCount: number,                // Cuántas veces se descargó
  lastDownloadedAt?: Date,
  lastDownloadedBy?: userId
}
```

---

### 4. **Generación de PDF Profesional**

**Librería:** `jsPDF` + `jspdf-autotable` (para tablas)

**Template:**

```typescript
// Estructura del PDF
1. Header (en cada página):
   - Logo del tenant (Fase 18)
   - Nombre de la empresa
   - "Informe Técnico Profesional"

2. Portada:
   - Título del informe
   - Número de pedido
   - Fecha de generación
   - Generado por: [Nombre del técnico]
   - Versión: v{N}

3. Tabla de Contenidos:
   - Auto-generada desde headers del markdown

4. Cuerpo del Informe:
   - Markdown convertido a PDF con formato
   - Secciones: Resumen, Análisis, Cumplimiento, Recomendaciones, Conclusión

5. Anexos:
   - Fuentes consultadas (RAG)
   - Metadata técnica (modelo, tokens, etc.)

6. Footer (en cada página):
   - Número de página
   - "Generado por ABD RAG Platform"
   - Watermark: "CONFIDENCIAL" (si configurado)
```

**Código de Generación:**

```typescript
import jsPDF from 'jspdf';
import { marked } from 'marked';

async function generatePDF(informe: Informe, tenant: Tenant): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Header con logo del tenant
  if (tenant.brandingAssets?.logo?.url) {
    const logoImg = await fetch(tenant.brandingAssets.logo.url);
    const logoBase64 = await logoImg.arrayBuffer();
    doc.addImage(logoBase64, 'PNG', 10, 10, 30, 15);
  }
  
  // Portada
  doc.setFontSize(24);
  doc.text('Informe Técnico Profesional', 105, 50, { align: 'center' });
  
  // Convertir markdown a PDF
  const html = marked(informe.contenidoMarkdown);
  doc.html(html, {
    callback: (doc) => {
      // Añadir footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Generado por ABD RAG Platform', 105, 295, { align: 'center' });
      }
    },
    x: 15,
    y: 70,
    width: 180
  });
  
  return doc.output('arraybuffer');
}
```

---

### 5. **UI de Gestión - Componente `InformeHistoryList`**

**Ubicación:** Al final de `/pedidos/[id]` (detalle del pedido)

**Features:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Informes Generados ({informes.length})</CardTitle>
    <Button onClick={handleGenerateNew}>
      <Sparkles /> Generar Nuevo Informe
    </Button>
  </CardHeader>
  
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Versión</TableHead>
          <TableHead>Generado Por</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Costo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {informes.map(informe => (
          <TableRow key={informe._id}>
            <TableCell>v{informe.version}</TableCell>
            <TableCell>{informe.nombreTecnico}</TableCell>
            <TableCell>{formatDate(informe.timestamp)}</TableCell>
            <TableCell>{informe.metadata.tokensUsados}</TableCell>
            <TableCell>${informe.metadata.costoUSD.toFixed(4)}</TableCell>
            <TableCell><Badge>{informe.estado}</Badge></TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuItem onClick={() => handleView(informe)}>
                  <Eye /> Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(informe)}>
                  <Download /> Descargar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCompare(informe)}>
                  <GitCompare /> Comparar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleArchive(informe)}>
                  <Archive /> Archivar
                </DropdownMenuItem>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

### 6. **Modal de Estimación de Costo**

Antes de generar, mostrar:

```tsx
<Modal>
  <ModalHeader>Generar Informe Profesional</ModalHeader>
  <ModalBody>
    <Alert variant="info">
      <AlertCircle />
      <AlertTitle>Estimación de Costo</AlertTitle>
      <AlertDescription>
        Este informe consumirá aproximadamente:
        - Tokens: ~{estimatedTokens}
        - Costo: ${estimatedCost} USD
        
        Límite mensual: {usedThisMonth}/{monthlyLimit} informes
        Presupuesto restante: ${remainingBudget} USD
      </AlertDescription>
    </Alert>
    
    {requireApproval && (
      <Alert variant="warning">
        <ShieldAlert />
        Este tenant requiere aprobación de un ADMIN antes de generar informes.
        Se enviará una solicitud.
      </Alert>
    )}
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
    <Button onClick={onConfirm}>
      {requireApproval ? 'Solicitar Aprobación' : 'Generar Informe'}
    </Button>
  </ModalFooter>
</Modal>
```

---

### 7. **Dashboard de Consumo (Admin)**

**Página:** `/admin/usage/llm-reports`

**Métricas:**

```tsx
<DashboardGrid>
  <StatCard
    title="Informes Generados (Este Mes)"
    value={reportsThisMonth}
    change="+12% vs mes anterior"
  />
  
  <StatCard
    title="Costo Total (Este Mes)"
    value={`$${totalCostThisMonth.toFixed(2)} USD`}
    change="-5% vs mes anterior"
  />
  
  <StatCard
    title="Tokens Consumidos"
    value={totalTokensThisMonth.toLocaleString()}
    change="+8% vs mes anterior"
  />
  
  <StatCard
    title="Usuarios Activos"
    value={activeUsersThisMonth}
    change="+3 nuevos"
  />
</DashboardGrid>

<Card>
  <CardHeader>
    <CardTitle>Consumo por Usuario</CardTitle>
  </CardHeader>
  <CardContent>
    <BarChart data={userConsumption} />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Tendencia de Costos</CardTitle>
  </CardHeader>
  <CardContent>
    <LineChart data={costTrend} />
  </CardContent>
</Card>
```

---

### 8. **Optimizaciones**

#### **Caché de Informes:**
```typescript
// Si se regenera con misma validación, reusar
const existingReport = await db.collection('informes_llm').findOne({
  pedidoId,
  validacionId,
  estado: 'APPROVED'
});

if (existingReport && !forceRegenerate) {
  return existingReport; // Reusar sin consumir tokens
}
```

#### **Async Processing (Queue):**
```typescript
// Para informes largos, usar BullMQ
import { Queue } from 'bullmq';

const reportQueue = new Queue('llm-reports');

await reportQueue.add('generate-report', {
  pedidoId,
  userId,
  tenantId
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});
```

---

### 9. **Compliance y Seguridad**

#### **Retención:**
```typescript
// Configurar TTL en Cloudinary
cloudinary.uploader.upload(pdfBuffer, {
  resource_type: 'raw',
  folder: `${tenantId}/informes/${pedidoId}`,
  tags: ['llm-report', `retention:${retentionYears}years`]
});

// Cron job para eliminar informes expirados
cron.schedule('0 0 * * *', async () => {
  const expiredReports = await db.collection('informes_llm').find({
    timestamp: { $lt: new Date(Date.now() - retentionYears * 365 * 24 * 60 * 60 * 1000) }
  });
  
  for (const report of expiredReports) {
    await cloudinary.uploader.destroy(report.pdfCloudinaryId);
    await db.collection('informes_llm').deleteOne({ _id: report._id });
  }
});
```

#### **GDPR:**
```typescript
// Al eliminar usuario, anonimizar informes
await db.collection('informes_llm').updateMany(
  { generadoPor: userId },
  {
    $set: {
      generadoPor: 'USUARIO_ELIMINADO',
      nombreTecnico: 'Usuario Anonimizado'
    }
  }
);
```

#### **Encriptación:**
```typescript
// Para informes sensibles
const encryptedPDF = await encrypt(pdfBuffer, tenant.encryptionKey);
await cloudinary.uploader.upload(encryptedPDF, {
  resource_type: 'raw',
  folder: `${tenantId}/informes/${pedidoId}`,
  tags: ['encrypted', 'confidential']
});
```

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ **Control de Costos:** 100% de tenants con límites configurados
- ✅ **Auditoría:** Tracking completo de todas las generaciones
- ✅ **Performance:** Generación de PDF < 3s (P95)
- ✅ **Almacenamiento:** 100% de informes en Cloudinary con versionado
- ✅ **UX:** Tiempo de descarga < 500ms (CDN)

---

## 🚀 IMPLEMENTACIÓN RECOMENDADA

### Fase 1 (Crítico):
1. Feature flag en schema de Tenant
2. Límites mensuales y validación
3. Almacenamiento en Cloudinary
4. UI de historial de informes

### Fase 2 (Importante):
1. Generación de PDF profesional
2. Estimación de costo pre-generación
3. Dashboard de consumo para Admin

### Fase 3 (Optimización):
1. Caché de informes
2. Async processing con queue
3. Comparación de versiones
4. Encriptación de informes sensibles

---

**Documento:** Diseño Técnico Fase 6.6.1  
**Fecha:** 23 de Enero de 2026  
**Estado:** Planificado - Pendiente de Implementación  
**Prioridad:** ⭐ CRÍTICO (Control de Costos)
