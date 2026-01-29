import elevatorsOntology from '../registry/elevators.json';

export interface EntityField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'select' | 'boolean' | 'relation' | 'files';
    required?: boolean;
    searchable?: boolean;
    options?: string[];
    ui?: {
        order?: number;
        width?: string;
        hidden?: boolean;
    };
}

export interface EntityWorkflowState {
    id: string;
    label: string;
    color: string;
}

export interface EntityDefinition {
    name: string;
    plural: string;
    slug: string;
    icon: string;
    fields: EntityField[];
    workflows?: {
        initial: string;
        states: EntityWorkflowState[];
    };
    api: {
        list: string;
        detail?: string;
        mutate: string;
        analyze?: string;
    };
    prompts?: {
        analyze?: string;
        summarize?: string;
        custom?: Record<string, string>;
    };
}

export interface Ontology {
    id: string;
    name: string;
    version: string;
    entities: EntityDefinition[];
    relationships?: RelationshipDefinition[];
}

export interface RelationshipDefinition {
    from: string;
    to: string;
    type: string;
    label: string;
}

/**
 * EntityEngine: El "Cerebro" que maneja la ontología y las entidades dinámicas.
 * Inicialmente carga desde archivos JSON locales (elevators.json).
 */
export class EntityEngine {
    private static instance: EntityEngine;
    private ontology: Ontology;

    private constructor() {
        // En el futuro esto podría cargar de DB por tenantId
        this.ontology = elevatorsOntology as unknown as Ontology;
    }

    public static getInstance(): EntityEngine {
        if (!EntityEngine.instance) {
            EntityEngine.instance = new EntityEngine();
        }
        return EntityEngine.instance;
    }

    public getEntity(slug: string): EntityDefinition | undefined {
        return this.ontology.entities.find(e => e.slug === slug || e.name === slug);
    }

    public getAllEntities(): EntityDefinition[] {
        return this.ontology.entities;
    }

    public getOntologyInfo() {
        return {
            id: this.ontology.id,
            name: this.ontology.name,
            version: this.ontology.version
        };
    }

    public renderPrompt(entitySlug: string, promptType: 'analyze' | 'summarize', variables: Record<string, string>): string {
        const entity = this.getEntity(entitySlug);
        if (!entity || !entity.prompts || !entity.prompts[promptType]) {
            return '';
        }

        let rendered = entity.prompts[promptType] as string;
        for (const [key, value] of Object.entries(variables)) {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return rendered;
    }
}
