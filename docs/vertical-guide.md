# Industry Vertical Guide

This document defines the standard structure and contract for adding industry-specific logic (verticals) to the ABD RAG Platform.

## Directory Structure

Every vertical must reside in `src/verticals/[industry-slug]` and follow this structure:

```
src/verticals/[industry-slug]/
├── config.ts          # Vertical configuration (VerticalConfig)
├── templates/         # Industry-specific prompt or report templates
└── components/        # Optional industry-specific UI components
```

## Configuration (`config.ts`)

The `config.ts` file must export a configuration object that satisfies the `VerticalConfig` interface (defined in `src/lib/schemas/verticals.ts`).

Example:
```typescript
import { VerticalConfig } from '../../lib/schemas/verticals';

export const MY_INDUSTRY_CONFIG: VerticalConfig = {
    industry: 'MY_INDUSTRY',
    entityLabel: { es: 'Entidad', en: 'Entity' },
    entityLabelPlural: { es: 'Entidades', en: 'Entities' },
    promptPack: 'MY_INDUSTRY',
    features: {
        'FEATURE_A': true,
    },
    fields: [
        {
            key: 'field_1',
            label: { es: 'Campo 1', en: 'Field 1' },
            type: 'string',
            required: true
        }
    ]
};
```

## Adding a New Vertical

1. **Create Directory**: `src/verticals/[slug]`.
2. **Define Config**: Create `config.ts`.
3. **Add Templates**: Create `templates/` directory.
4. **Register**: Add the vertical to the global `IndustryRouter` or `ModuleRegistryService` (if dynamic loading is not fully automated).
5. **i18n**: Ensure all labels in `config.ts` follow the multi-language object pattern `{ es: string, en: string }`.
