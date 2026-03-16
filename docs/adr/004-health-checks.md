# ADR 004: Comprehensive Health Checks

## Status
Accepted (Audit Remediation)

## Context
Standard monitoring systems require reliable endpoints to verify application and dependency health.

## Decision
We have implemented three levels of health checks in `/api/health`:
1. **Basic (`/api/health`)**: Publicly accessible, returns "UP" status and uptime. Used by load balancers.
2. **DB Connectivity (`/api/health/db-check`)**: Confirms AUTH DB and user availability. Requires `manage` permissions.
3. **Deep System Audit (`/api/health/deep`)**: End-to-end check of MongoDB, Redis, and Gemini API. Requires `read` permissions.

## Consequences
- Fast incident detection.
- Secure exposure of system details (only for authorized personnel).
