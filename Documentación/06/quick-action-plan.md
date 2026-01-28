# QUICK REFERENCE: Los 9 Gaps Críticos - Orden de Acción

## 📊 PRIORIDAD & IMPACTO

| # | Gap | Severidad | Impacto | Complejidad | Tiempo Est. |
|---|-----|-----------|---------|-------------|------------|
| 1 | **Inmutabilidad de auditoría** | 🔴 CRÍTICO | Compliance GDPR/ISO27001 | Media | 2 sem |
| 2 | **Soft-delete & deleteddata** | 🔴 CRÍTICO | Forensics, GDPR, liability | Media | 2 sem |
| 3 | **Segregación de funciones (4-eyes)** | 🔴 CRÍTICO | Prevención fraude, segregación roles | Alta | 3 sem |
| 4 | **Firma digital validada** | 🟡 ALTO | Repudio, cambios críticos | Alta | 3 sem |
| 5 | **Auditoría de configuración (security changes)** | 🟡 ALTO | Trazabilidad MFA/roles/API keys | Media | 2 sem |
| 6 | **Ciclo de vida explícito & retención** | 🟡 ALTO | GDPR compliance, data governance | Media | 2 sem |
| 7 | **Alertas de anomalías en tiempo real** | 🟡 ALTO | Seguridad operacional, respuesta incidentes | Media | 2 sem |
| 8 | **Cifrado field-level de logs** | 🟡 ALTO | Protección data sensitiva | Media | 2 sem |
| 9 | **Integridad periódica (hash verification)** | 🟡 ALTO | Detección de tampering | Baja | 1 sem |

---

## 🎯 AGRUPACIÓN POR ESFUERZO (Para planning)

### **Semana 1-2: FOUNDATION (Immutabilidad)**
```
✓ Crear colecciones append-only (audittrail, deleteddata, configaudittrail, securityalerts)
✓ Implementar chain-of-hash (previousHash validación)
✓ Validar integridad en lectura de logs
✓ Disable UPDATE/DELETE en estas colecciones (schema validation)

IMPACTO: 15% del trabajo total, 80% de valor
```

### **Semana 2-3: SOFT-DELETE & RETENTION**
```
✓ Agregar campos deleted/deletedAt/deletedBy a todas las entidades críticas
✓ Crear índices en {deleted:1, tenantId:1}
✓ Update all DELETE queries → soft-delete con razón + aprobación
✓ Define data retention policy por entity type
✓ Implement monthly archiving job (move a archived_* collections)

IMPACTO: 20% del trabajo, 90% de valor (GDPR critical)
```

### **Semana 3-4: SEGREGACIÓN & APPROVAL**
```
✓ Crear rol COMPLIANCE (read-only auditoría)
✓ Implement 4-eyes approval para:
  - Cambios de prompts activos
  - Cambios de roles de usuario
  - Cambios de MFA settings
  - Transiciones críticas en workflows
✓ Requerir razón + aprobación en cada operación

IMPACTO: 25% del trabajo, 85% de valor (security critical)
```

### **Semana 4-5: FIRMA DIGITAL**
```
✓ Implementar HMAC-SHA256 para firmas (MVP)
✓ Validación on-read de firmas
✓ Requerir firma en: aprobación prompts, transiciones críticas, cambios MFA
✓ AWS Secrets Manager para key management
✓ Loguear fallo de validación de firma como SECURITY alert

IMPACTO: 20% del trabajo, 70% de valor (non-repudiation)
```

### **Semana 5: ALERTAS & INTEGRIDAD**
```
✓ Real-time anomaly detection:
  - 5+ failed MFA attempts en 5 min → bloquear IP
  - Acceso no autorizado a /admin → alert CRITICAL
  - 100+ deletes en 5 min → freeze + escalar
  
✓ Weekly data integrity checks:
  - Recalcular hash de documentos críticos
  - Comparar con hash guardado
  - Log tamper attempts

✓ Webhook a Slack/PagerDuty para CRITICAL alerts

IMPACTO: 20% del trabajo, 75% de valor (operations)
```

---

## 📋 CHECKLIST POR GAP

### GAP 1: IMMUTABILIDAD (Semana 1)
```
HACER:
  [ ] Crear colección audittrail (append-only)
  [ ] Crear colección deleteddata (append-only)
  [ ] Crear colección configaudittrail (append-only)
  [ ] Crear colección securityalerts (append-only)
  [ ] Agregar schema validation: no UPDATE/DELETE permitidos
  [ ] Implementar previousHash chain:
      - Log N tiene hash SHA256(Log N-1 + datos)
      - Validar cadena en lectura
  [ ] Refactor logEvento para usar audittrail
  [ ] Test: intentar actualizar log → debe fallar
  
RESULTADO ESPERADO:
  - Ningún log puede ser borrado/editado sin dejar traza
  - Cadena de integridad detectable si alguien modifica base de datos
```

### GAP 2: SOFT-DELETE & RETENTION (Semana 2)
```
HACER:
  [ ] Agregar campos a schemas:
      - deleted: boolean (default false)
      - deletedAt: Date | null
      - deletedBy: string (email)
      - deleteReason: string
      - deleteMethod: "ui" | "api" | "batch" | "admin"
  
  [ ] Refactor todas las operaciones DELETE:
      - DELETE → PATCH {deleted: true, deletedAt: now(), ...}
      - Guardar snapshot completo en deleteddata ANTES de marcar como deleted
      - Loguear en configaudittrail con correlación
  
  [ ] Crear índices:
      - {deleted: 1, tenantId: 1}
      - Para búsquedas rápidas de activos
  
  [ ] Define retención por entity (table en doc):
      - Pedidos: 3 años active, 5 años total
      - Documentos: indefinido
      - Logs: 90 días active, 1 año archive
      - Usuarios: 2 años soft, GDPR después
  
  [ ] Implement monthly archiving job:
      - Date.now() > createdAt + retention_months
      - Move a colección archived_ENTITYTYPE
      - Log en audittrail
  
  RESULTADO ESPERADO:
    - Ningún dato se borra permanentemente
    - Puedes recuperar qué se borró, quién, cuándo, por qué
    - GDPR compliant (auditeable deletion trail)
```

### GAP 3: SEGREGACIÓN DE FUNCIONES (Semana 3)
```
HACER:
  [ ] Crear rol COMPLIANCE (o AUDITOR):
      - Permiso: read logsaplicacion, audittrail, configaudittrail, deleteddata
      - Permiso: leer casos, prompts, documentos
      - NO: crear, editar, borrar nada
      
  [ ] Implementar 4-eyes en Prompts:
      - TECNICO/INGENIERIA propone cambio
      - ADMIN debe aprobar (firma + comentario)
      - Si no aprobado en 7 días → revertir automático
      - Loguear en configaudittrail
  
  [ ] Implementar 4-eyes en Roles:
      - Usuario ADMIN quiere cambiar rol de otro usuario
      - Requerir aprobación de SUPERADMIN
      - Email notification de cambio
      - Loguear en configaudittrail
  
  [ ] Implementar 4-eyes en MFA:
      - Usuario solicita deshabilitar MFA
      - Requerir 2FA para confirmar (SUPERADMIN level)
      - Loguear en configaudittrail como SECURITY alert
  
  [ ] Transiciones críticas de casos:
      - Solo ADMIN o nuevo rol SUPERVISOR puede cambiar estado
      - Requerir comentario obligatorio
      - Si transición cambia criticidad, requerir firma
  
  RESULTADO ESPERADO:
    - Nadie puede hacer cambios críticos sin aprobación de otro rol
    - Pista clara de quién propuso y quién aprobó
    - Prevención de "insider" riesgos de un único actor
```

### GAP 4: FIRMA DIGITAL (Semana 4)
```
HACER:
  [ ] Agregar método de firma HMAC-SHA256 (MVP):
      - Secret key = ${TENANT_ID}_${ADMIN_EMAIL}_signingkey
      - Guardar en AWS Secrets Manager (NO en env)
      - Firma = HMAC-SHA256(documento + correlacionid + timestamp, secret)
  
  [ ] Actualizar schema de operaciones críticas:
      {
        ...data,
        signature: {
          signingMethod: "hmacsha256",
          signatureValue: "hex-encoded-signature",
          signedAt: Date,
          signedBy: email,
          ipAddress: string,
          validated: boolean,
          validationAt?: Date
        }
      }
  
  [ ] Implementar validación on-read:
      - Cuando se lee documento firmado, re-calcular signature
      - Si no coincide → log SECURITY.SIGNATURE_MISMATCH
      - Mostrar warning al usuario
  
  [ ] Requerir firma en:
      - Aprobación de cambios de prompts
      - Transiciones COMPLETED en casos
      - Cambios MFA
      - Cambios de permisos/roles
  
  [ ] Loguear intento fallido de firma:
      - origen: SIGNATURE_VALIDATION
      - accion: SIGNATURE_INVALID
      - detalles: documento, razón del fallo
  
  RESULTADO ESPERADO:
    - No-repudiation: el que firmó no puede negar después
    - Si alguien modifica documento post-firma, se detecta
    - Pista clara de autorización en cambios críticos
```

### GAP 5: AUDITORÍA DE CONFIGURACIÓN (Semana 2)
```
HACER:
  [ ] Crear tabla en configaudittrail para cada tipo de cambio:
      - Prompts (template, variables, active status)
      - MFA (enable, disable, recovery codes)
      - Roles/Permissions (add, remove, modify)
      - Tenant settings (industry, custom fields)
      - API keys (generate, rotate, revoke)
      - Rate limits (change, override)
  
  [ ] Schema para cada cambio:
      {
        changeId: UUID,
        changeType: "prompt" | "mfa" | "role" | ... ,
        entityId: ObjectId,
        changedBy: { email, userId, role },
        previousValue: {...},
        newValue: {...},
        changeReason: string (OBLIGATORIO),
        approvedBy?: { email, timestamp },
        correlacionid: string,
        timestamp: Date,
        hash: SHA256(previousValue + newValue + changedBy)
      }
  
  [ ] Refactor servicios para loguear cambios:
      - En MfaService.disable() → log en configaudittrail
      - En UserService.updateRole() → log en configaudittrail
      - En PromptService.update() → log en configaudittrail + versión
      - En TenantService.updateConfig() → log en configaudittrail
  
  [ ] Implementar "change request" workflow:
      - Usuario solicita cambio
      - Admin/Supervisor aprueba o rechaza
      - Si aprueba → loguear con approvedBy
      - Si rechaza → loguear razón
  
  RESULTADO ESPERADO:
    - Trazabilidad completa de por qué cambió la configuración
    - Pista de aprobación antes de cambios críticos
    - Auditoría de seguridad de cambios de roles/MFA
```

### GAP 6: CICLO DE VIDA & RETENCIÓN (Semana 2)
```
HACER:
  [ ] Crear colección dataretentionpolicy:
      {
        entityType: "pedido" | "documento" | "prompt" | ... ,
        tenantId: string,
        activeRetentionMonths: 36,
        archiveRetentionMonths: 60,
        allowDeletion: false,
        requiresApprovalForDeletion: true,
        complianceReason: "GDPR, ISO27001, etc.",
        lastReviewedAt: Date,
        nextReviewAt: Date (30 días después)
      }
  
  [ ] Tabla default (ver documento principal)
  
  [ ] Crear Vercel Cron job (1º de cada mes):
      - Para cada entityType, buscar documentos aging out
      - Si createdAt + activeRetention < now():
        - Move a archived_ENTITYTYPE
        - Log en audittrail con reason: "automatic archiving"
      - Si createdAt + archiveRetention < now() && allowDeletion:
        - Permanent hard delete (después de 3 advertencias)
        - Log en deleteddata con complianceContext
  
  [ ] Crear interfaz de admin para:
      - Ver políticas actuales
      - Solicitar cambio de política
      - Requiere aprobación COMPLIANCE
      - Histórico de cambios políticas
  
  RESULTADO ESPERADO:
    - Política clara de qué sucede con datos en tiempo
    - Cumplimiento automático de retención GDPR
    - Auditoría de archivado/borrado
```

### GAP 7: ALERTAS DE ANOMALÍAS (Semana 5)
```
HACER:
  [ ] Implementar detectores (en middleware + servicios):
      1. Brute force MFA:
         - 5+ failed MFA en 5 min desde mismo usuario/IP
         - Acción: bloquear IP, enviar alert CRITICAL, email a usuario
      
      2. Unauthorized access:
         - Usuario TECNICO intentando /admin/global-stats
         - Acción: log como 403, alert WARN
      
      3. Anomalous deletion:
         - 100+ documentos borrados en 5 min
         - Acción: freeze ediciones, alert CRITICAL, escalar
      
      4. Prompt spam:
         - Prompt editado 20+ veces en 1 hora
         - Acción: congelar, alert WARN, require approval
      
      5. RAG abuse:
         - 1000+ búsquedas en 5 min desde usuario
         - Acción: rate limit stricter, alert WARN
      
      6. Config changes:
         - 5+ cambios de rol/MFA en 10 min
         - Acción: alert CRITICAL, require approval, freeze further changes
  
  [ ] Crear tabla securityalerts con eventos
  
  [ ] Webhook a Slack/PagerDuty:
      - CRITICAL → PagerDuty + Slack @security-team
      - WARN → Slack #security-alerts
      - INFO → Slack #audit-log (background)
  
  [ ] Dashboard de alertas en admin:
      - Ver alertas últimas 24h
      - Filtrar por tipo, severidad, tenant
      - Marcar como "acknowledged", "resolved"
      - Crear incident si es CRITICAL
  
  RESULTADO ESPERADO:
    - Detección automática de comportamiento anómalo
    - Respuesta rápida a incidentes de seguridad
    - Visibilidad ops de qué está sucediendo
```

### GAP 8: CIFRADO FIELD-LEVEL (Semana 5)
```
HACER:
  [ ] Seleccionar librería:
      - mongodb-client-encryption (oficial)
      - o simple: crypto.createCipheriv("aes-256-gcm", key, iv)
  
  [ ] Campos a cifrar en audittrail:
      - userAgent (identifica devices)
      - ipAddress (identifica usuarios)
      - performedBy (email)
      - detalles (en algunos casos sensibles)
  
  [ ] Campos NO cifrados (necesarios para búsquedas):
      - timestamp
      - correlacionid
      - nivel
      - accion
      - tenantId
      - origen
  
  [ ] Key management:
      - AWS KMS o Google Cloud KMS
      - Master key = key por tenant
      - Automatic rotation cada 90 días
      - Audit cada acceso a key
  
  [ ] Refactor query:
      - Búsquedas por nivel/accion siguen funcionando
      - Búsquedas por email → desencriptar todos y filtrar (lento, no escala)
      - Solución: field-level encryption + index en field no-encriptado
  
  RESULTADO ESPERADO:
    - Incluso si alguien accede DB, no ve emails/IPs en claro
    - Compliance con requerimientos de cifrado (SOC 2, HIPAA, etc.)
    - Key rotation automática
```

### GAP 9: INTEGRIDAD PERIÓDICA (Semana 1)
```
HACER:
  [ ] Crear job que corra semanal (Vercel Cron):
      - Para cada documento "crítico":
        - Recalcular hash = SHA256(serialize(document))
        - Comparar con integrityHash guardado
        - Si no coincide:
          - Log SECURITY.DATA_INTEGRITY_VIOLATION
          - Alert CRITICAL
          - Marcar documento como "TAMPERED"
          - No permitir lectura hasta investigación
  
  [ ] Documentos "críticos":
      - Todos los que tienen firma digital
      - Casos completados
      - Prompts activos
      - Análisis de riesgo
      - Invoices/facturas
  
  [ ] Agregar campos a schemas:
      {
        ...data,
        integrityHash: "sha256:...",
        integrityCheckedAt: Date,
        integrityStatus: "VALID" | "TAMPERED" | "UNVERIFIED",
        integrityCheckFailures: number (acumula intentos fallidos)
      }
  
  [ ] Reporte semanal:
      - Email a COMPLIANCE/ADMIN
      - Documentos verificados: N
      - Tampered documents: 0 (idealmente)
      - Fallo de verificación: motivo probable
  
  [ ] Si se detecta tampering:
      - Crear incident en tabla securityalerts
      - Notificar SUPERADMIN
      - Generar forensic report (qué cambió, cuándo, desde dónde)
  
  RESULTADO ESPERADO:
    - Detección automática de modificación de datos en DB
    - Auditoría post-incidente clara
    - Prueba de integridad para compliance
```

---

## 🚀 ROADMAP FINAL

```
┌─────────────────────────────────────────────────────────────────┐
│                   SEMANAS 1-5: FOUNDATION PHASE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SEMANA 1: Immutabilidad + Integridad                            │
│ └─ audittrail (append-only)                                    │
│ └─ deleteddata (snapshot before delete)                        │
│ └─ Chain-of-hash validation                                    │
│ └─ Weekly integrity checks                                     │
│ ⏱️  Esfuerzo: 40 horas                                          │
│ 📊 Cobertura: +10% (55% → 65%)                                 │
│                                                                 │
│ SEMANA 2: Soft-Delete + Retención + Config Audit Trail          │
│ └─ Soft-delete en todas las entidades                          │
│ └─ deletedData colección poblada                               │
│ └─ configaudittrail para cambios de config                     │
│ └─ Data retention policy                                       │
│ ⏱️  Esfuerzo: 50 horas                                          │
│ 📊 Cobertura: +15% (65% → 80%)                                 │
│                                                                 │
│ SEMANA 3: Segregación de Funciones                              │
│ └─ Rol COMPLIANCE (read-only)                                  │
│ └─ 4-eyes approval en prompts                                  │
│ └─ 4-eyes approval en roles                                    │
│ └─ 4-eyes approval en MFA                                      │
│ └─ Transiciones críticas requieren approval                    │
│ ⏱️  Esfuerzo: 60 horas                                          │
│ 📊 Cobertura: +10% (80% → 90%)                                 │
│                                                                 │
│ SEMANA 4: Firma Digital                                         │
│ └─ HMAC-SHA256 signing                                         │
│ └─ Validación on-read                                          │
│ └─ AWS Secrets Manager para keys                               │
│ └─ Requerir firma en operaciones críticas                      │
│ ⏱️  Esfuerzo: 50 horas                                          │
│ 📊 Cobertura: +5% (90% → 95%)                                  │
│                                                                 │
│ SEMANA 5: Alertas + Cifrado                                     │
│ └─ Real-time anomaly detection                                 │
│ └─ Webhook a Slack/PagerDuty                                   │
│ └─ Field-level encryption de logs                              │
│ └─ AWS KMS key management                                      │
│ ⏱️  Esfuerzo: 50 horas                                          │
│ 📊 Cobertura: +5% (95% → 100% full bank-grade)                 │
│                                                                 │
│ TOTAL: 250 horas (≈ 6 semanas @ 40 h/week)                     │
│ TOTAL: 2 devs x 3 semanas, o 1 dev x 6 semanas                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

TESTING & DEPLOYMENT:
  Semana 6: Testing exhaustivo + security review
  Semana 7: Deployment gradual + monitoring
  Semana 8: Cumplimiento & auditoría interna
```

---

## 🎯 VERIFICACIÓN POST-IMPLEMENTACIÓN

Cuando termines cada fase, valida:

**Fase 1 (Immutabilidad)**
- [ ] Intentar UPDATE en audittrail → falla
- [ ] Intentar DELETE en audittrail → falla
- [ ] Cadena de hash valida en lectura
- [ ] Documento tampered es detectado

**Fase 2 (Soft-Delete)**
- [ ] DELETE → PATCH {deleted:true}
- [ ] Snapshot guardado en deleteddata
- [ ] Recuperar eliminado es posible
- [ ] GDPR request workflow funciona

**Fase 3 (Segregación)**
- [ ] Cambio de prompt requiere approval
- [ ] Cambio de rol requiere approval
- [ ] Rol COMPLIANCE ve logs pero no puede editar
- [ ] Email de notificación enviado

**Fase 4 (Firma)**
- [ ] Firma generada en cambios críticos
- [ ] Validación on-read funciona
- [ ] Documento tampered alerta
- [ ] Non-repudiation probada

**Fase 5 (Alertas)**
- [ ] 5 failed MFA = bloqueo IP
- [ ] 100 deletes en 5 min = freeze
- [ ] Slack notification recibida
- [ ] Incident creado en tabla alerts

---

## 📞 SOPORTE DURANTE IMPLEMENTACIÓN

**Si tienes dudas sobre:**
- Schema updates → revisar ejemplos en doc principal
- Transacciones atomicity → MongoDB sessions
- Performance de queries → revisar índices en gap principal
- Key management → AWS KMS docs
- Testing → coverage mínimo 80% en nuevas features

**Hito crítico**: Antes de llevar clientes "enterprise" o financieros, completar al menos **Fase 1 + Fase 2**.

Sin esto, fallará cualquier auditoría de ISO 27001 o cumplimiento GDPR.

---

**Documento de referencia rápida compilado**: 28 Enero 2026
**Próxima revisión**: Post Fase 2 (estimada Semana 4)
