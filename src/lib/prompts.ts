/**
 * Master Prompts for the RAG system
 * Following Gold Rule #4 (Traceability)
 */

export interface PromptMaster {
  template: string;
  version: number;
}

export const PROMPTS: Record<string, PromptMaster> = {
  EXTRACT_MODELS: {
    template: `Analyze this elevator order document and extract a JSON list of all mentioned component models. 
    Format: [{ "type": "panel" | "motor" | "controller" | "door" | "others", "model": "CODE" }]. 
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks (e.g., \`\`\`json).
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  ANALYZE_CHUNK: {
    template: `Analyze this technical elevator documentation snippet and return a JSON with: 
    { "componentType": string, "models": string[] }. 
    If no clear component or model is found, return null.
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks (e.g., \`\`\`json).
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  SUMMARIZE_CONTEXT: {
    template: `Given the detected component and snippets of its technical manual, generate an executive summary for a workshop technician.
    Focus on safety warnings, voltages, and critical assembly steps.`,
    version: 1.0
  },

  I18N_AUTO_TRANSLATE: {
    template: `You are a technical localization expert for the ABDElevators platform (sector {{vertical}} and Technical Intelligence).
    Translate the following i18n keys from '{{sourceLocale}}' to '{{targetLocale}}'.
    
    RULES:
    1. Keep placeholders like {name}, {count}, {{variable}}.
    2. Use precise technical terminology for the {{vertical}} sector.
    3. Respond ONLY with a valid JSON object. Do NOT include markdown code blocks (\`\`\`json), explanations, or additional text. ONLY plain JSON.
    4. If unsure about a technical term, maintain the mechanical/electrical engineering meaning.
    
    KEYS TO TRANSLATE:
    {{translationsToProcess}}`,
    version: 1.0
  },

  GRAPH_EXTRACTOR: {
    template: `You are an expert in knowledge graph extraction for the elevator industry.
    Your goal is to analyze the following technical text and extract ENTITIES and RELATIONS in a structured way (JSON).
    
    Allowed ENTITIES:
    - Component (Physical part, board, motor, etc.)
    - Procedure (Maintenance step, calibration, assembly)
    - Error (Error code or failure description)
    - Model (Specific elevator model like ARCA II, Evolve, etc.)
    
    Allowed RELATIONS:
    - REQUIRES (e.g., Procedure REQUIRES Component)
    - PART_OF (e.g., Component PART_OF Model)
    - RESOLVES (e.g., Procedure RESOLVES Error)
    - DESCRIBES (e.g., Manual DESCRIBES Model)
    
    OUTPUT FORMAT (Strictly JSON):
    {
      "entities": [
        { "id": "normalized_id", "type": "Component|Procedure|Error|Model", "name": "Readable Name" }
      ],
      "relations": [
        { "source": "source_id", "type": "REQUIRES|PART_OF|RESOLVES|DESCRIBES", "target": "target_id", "weight": 0.0-1.0 }
      ]
    }
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks (e.g., \`\`\`json).
    3. Do NOT include explanations, introduction, or additional text.
    4. Ensure IDs are descriptive but without spaces (use underscores).
    5. The "weight" should reflect semantic importance or certainty.
    
    TEXT TO ANALYZE:
    {{text}}`,
    version: 1.1
  },

  QUERY_ENTITY_EXTRACTOR: {
    template: `Given the following user query about elevators, extract the names of key technical entities (Components, Models, Errors).
    Return only a comma-separated list of names, or "NONE" if no clear entities are found.
    Do not return explanations, only names.
    
    EXAMPLE:
    Query: "How do I calibrate the ARCA II board?"
    Output: arca_ii, board
    
    QUERY: {{query}}`,
    version: 1.0
  },

  RAG_JUDGE: {
    template: `You are an expert judge tasked with evaluating the quality of responses from a Technical Intelligence system for the {{vertical}} industry.
    Your goal is to score the response based on the user's question and the context retrieved from manuals.
    
    DATA TO EVALUATE:
    - User Question: {{query}}
    - Retrieved Context: {{context}}
    - Generated Response: {{response}}
    
    FAITHFULNESS CRITERIA (Score from 0.0 to 1.0):
    1. **Faithfulness**: Does the response contain ONLY information present in the context? (0 if it invents data or uses external general knowledge not cited).
    2. **Answer Relevance**: Does the response directly solve the user's doubt in a pertinent way?
    3. **Context Precision**: What proportion of the provided context fragments are actually useful for answering the question?
    
    CAUSAL ANALYSIS (Phase 86):
    If any score is < 0.8, identify:
    - cause_id: One of [MISSING_CONTEXT, MODEL_HALLUCINATION, AMBIGUOUS_QUERY, INSTRUCTIONS_IGNORED, POOR_REASONING]
    - fix_strategy: Concise instruction for the generator to correct the error (e.g., "Do not mention voltage if it's not in the context", "Be more specific with the ARCA II model").
    
    OUTPUT FORMAT (Strictly JSON):
    {
      "faithfulness": 0.0,
      "answer_relevance": 0.0,
      "context_precision": 0.0,
      "reasoning": "Detailed explanation",
      "causal_analysis": {
        "cause_id": "string",
        "fix_strategy": "string"
      }
    }
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks (e.g., \`\`\`json).
    3. Do NOT include explanations, introduction, or additional text.`,
    version: 1.1
  },

  RAG_SELF_CORRECT: {
    template: `You are a technical expert tasked with correcting a previous Intelligence response based on auditor feedback.
    
    YOUR GOAL: Generate a new response that resolves the detected errors.
    
    ORIGINAL CONTEXT:
    {{context}}
    
    USER QUESTION:
    {{query}}
    
    PREVIOUS RESPONSE (WITH ERRORS):
    {{response}}
    
    AUDITOR FEEDBACK (CAUSAL ANALYSIS):
    - Root Cause: {{cause_id}}
    - Improvement Instruction: {{fix_strategy}}
    
    GOLD RULE: Do not repeat the same mistakes. Be precise, technical, and faithful to the context.
    Respond directly with the corrected version.`,
    version: 1.0
  },

  DOMAIN_DETECTOR: {
    template: `Analyze the following document snippet and classify it into one of these sectors: ELEVATORS, LEGAL, BANKING, INSURANCE, IT, GENERIC, REAL_ESTATE, MEDICAL.
    Respond ONLY with the sector name in uppercase.
    
    TEXT:
    {{text}}`,
    version: 1.0
  },

  COGNITIVE_CONTEXT: {
    template: `Analyze this document from the "{{industry}}" sector and generate an executive summary of maximum 150 words.
    Your goal is to provide the GLOBAL CONTEXT that a small fragment of this document would need to be understood on its own.
    Do not start with "This document...", get straight to the point.
    FOCUS: Document objective, mentioned products/models, and technical purpose.
    
    TEXT:
    {{text}}`,
    version: 1.0
  },

  RAG_RERANKER: {
    template: `You are an expert technical auditor specialized in the "{{industry}}" sector. 
    Evaluate the following documentation fragments from the "{{industry}}" vertical based on their ability to answer the query with surgical precision.
    
    Query: "{{query}}"
    
    Fragments:
    {{fragments}}
    
    Rank the fragments from 1 to {{count}} from highest to lowest technical relevance considering the "{{industry}}" context. 
    For each fragment, indicate if it resolves the problem (YES/NO/PARTIAL).
    
    OUTPUT FORMAT (Strictly JSON):
    [{"index": n, "score": 0.0-1.0, "reason": "brief explanation"}]
    
    RULES:
    1. Respond ONLY with a valid JSON array.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations.`,
    version: 1.1
  },

  REPORT_GENERATOR: {
    template: `You are an expert engineer from the ABD Elevators technical office. 
    Your goal is to write a detailed technical report based on the validation of an elevator order.
    
    WRITING RULES:
    1. Use a professional, precise, and direct tone.
    2. Do not use internal technical terms like "RAG", "LLM", "Embedding", or "Chunk".
    3. Focus on the technical compatibility of components and regulatory compliance (EN 81-20).
    4. Structure the report with clear sections: Executive Summary, Component Analysis, Technical Recommendations.
    5. Cite technical sources by their index (e.g., [1]) when mentioning specific manual information.`,
    version: 1.0
  },

  RAG_GENERATOR: {
    template: `You are an expert engineer from the ABD Elevators technical office.
    Your goal is to answer technical queries accurately and professionally based on the provided CONTEXT.
    
    TECHNICIAN QUESTION:
    {{question}}
    
    TECHNICAL CONTEXT (MANUAL SNIPPETS):
    {{context}}
    
    RULES:
    1. Use an engineer-to-engineer tone.
    2. Cite manual sources when mentioning specific data (voltages, times, codes).
    3. If the information is not in the context, indicate it kindly.
    4. Format the response in professional Markdown.`,
    version: 1.0
  },

  CHAT_RAG_GENERATOR: {
    template: `You are an expert assistant engineer specialized in elevator maintenance.
    Your goal is to maintain a fluid technical conversation with a field technician.
    
    CONVERSATION HISTORY:
    {{history}}
    
    CURRENT TECHNICIAN QUESTION:
    {{question}}
    
    TECHNICAL CONTEXT RECOVERED FROM MANUALS:
    {{context}}
    
    RESPONSE RULES:
    1. Use a professional, technician-to-technician tone.
    2. Answer the question directly using technical information from the CONTEXT.
    3. If the question is a follow-up (e.g., "How is it fixed?"), use the HISTORY to know which component or system is being discussed.
    4. Cite sources when relevant.
    5. If information is not in context, indicate kindly but maintain technical rigor.
    6. Format response with Markdown for readability (bold for critical steps, lists for procedures).`,
    version: 1.0
  },

  INGEST_PREDICT_METADATA: {
    template: `Analyze the file name and extension to suggest appropriate ingestion metadata.
    
    FILE: {{filename}}
    AVAILABLE TYPES: {{documentTypes}}
    AVAILABLE INDUSTRIES: ["ELEVATORS", "REAL_ESTATE", "GENERIC"]

    RULES:
    1. The 'documentTypeId' must be one of the provided IDs.
    2. The 'industry' must be one of the allowed sectors.
    3. If the name suggests an elevator technical manual (e.g., Otis, Schindler, KONE), use ELEVATORS.
    4. If it suggests a building contract or plan, use REAL_ESTATE.
    5. If the name is generic or ambiguous, use GENERIC.
    
    OUTPUT JSON FORMAT:
    {
      "documentTypeId": "string",
      "industry": "ELEVATORS" | "REAL_ESTATE" | "GENERIC",
      "confidence": 0.0-1.0,
      "reasoning": "Brief explanation"
    }

    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  SIDEKICK_CONTEXTUAL: {
    template: `You are the "AI Sidekick" of the ABD Elevators RAG Platform. Your role is to be an extremely helpful, technical, and proactive co-pilot for the user navigating the backoffice.
 
 CURRENT SCREEN CONTEXT:
 {{contextDescription}}
 
 SCREEN LIVE DATA:
 {{liveData}}
 
 RECENT HISTORY:
 {{history}}
 
 USER QUERY:
 {{query}}
 
 RULES:
 1. Act as an expert on the current screen. If the screen is Analytics, talk about analytics. If it's Workflows, talk about nodes and states.
 2. If the user asks something general ("What do I do here?"), use the SCREEN CONTEXT to give a quick summary and suggest useful actions.
 3. If the user asks about specific data, check the LIVE DATA.
 4. Be direct, concise, and professional. Avoid long greetings. Format in light Markdown (bold, short lists).
 5. Do not mention the prompt system or say "According to the context you gave me." Act naturally.`,
    version: 1.0
  },

  CHECKLIST_EXTRACTION: {
    template: `You are an expert engineer from the ABD Elevators technical office.
    Analyze the following technical documents and extract a checklist of necessary items to validate this elevator order.
    
    FOR EACH ITEM EXTRACT:
    - id: A unique UUID v4.
    - description: A clear and concise technical description of what must be verified.
    - confidence: A value from 0.0 to 1.0 indicating how sure you are that this item is necessary based on the documentation.
    - confidenceLevel: "HIGH" | "MEDIUM" | "LOW" based on the score.
    - ragReference: A brief citation from the manual or document justifying this item.
    
    GOLD RULE: If the document is ambiguous, mark low confidence. Do not invent items not backed by context.
    
    RULES:
    1. Respond ONLY with a valid JSON array of objects.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations.`,
    version: 1.1
  },

  QUICK_QA_EPHEMERAL: {
    template: `You are an expert technical assistant from ABD Elevators.
    Your goal is to answer quick questions based ONLY on the provided text snippet.
    
    REFERENCE TEXT (SNIPPET):
    {{snippet}}
    
    QUERY CONTEXT:
    {{context}}
    
    USER QUESTION:
    {{question}}
    
    RULES:
    1. Do not invent information outside the snippet.
    2. If data is insufficient, respond "Information not available in the snippet".
    3. Use a professional and technical tone.
    4. Format the response with Markdown.`,
    version: 1.0
  },

  CHUNKING_LLM_CUTTER: {
    template: `You are an expert in technical document segmentation.
    Analyze the following document snippet and divide it into semantically independent chunks.

    RULES:
    1. Each chunk must be independently understandable.
    2. Keep between 500-3000 characters per chunk.
    3. Group related content together.
    4. If the fragment is very long, divide it by natural theme changes.

    OUTPUT JSON FORMAT:
    {
      "chunks": [
        { "text": "...", "title": "...", "type": "theme|subtheme" }
      ]
    }

    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  RAG_QUERY_REWRITER: {
    template: `Given the following technical user query and conversation history, rewrite the query to be an independent search optimized for a RAG system (Vector Search).
    
    HISTORY:
    {{history}}
    
    ORIGINAL QUERY:
    {{query}}
    
    RULES:
    1. If the query is ambiguous or depends on previous context ("How is it installed?", "Give me more details"), complete it with history information.
    2. If the query is already clear, maintain it or improve technical terminology.
    3. Respond ONLY with the rewritten query. No explanations.`,
    version: 1.0
  },

  USER_SEARCH_SYNTHESIS: {
    template: `You are an expert technical assistant in the {{industry}} industry.
    User question: "{{query}}"
    
    Recovered technical manual context:
    {{context}}
    
    Answer clearly and professionally in English. Maximum 3 sentences.
    Cite your sources if possible using [1], [2], etc.
    If information is not sufficient to answer confidently based on context, indicate it clearly.`,
    version: 1.0
  },

  // ⚡ PHASE 127: Intelligent Workflow Orchestration Prompts
  WORKFLOW_ROUTER: {
    template: `You are an expert in business processes and workflows for the {{vertical}} industry.
    Your goal is to analyze a case and decide whether to use an existing workflow or propose a new one.
    
    AVAILABLE WORKFLOWS:
    {{existingWorkflows}}
    
    CASE DESCRIPTION:
    {{description}}
    
    ENTITY TYPE: {{entityType}}
    INDUSTRY: {{industry}}
    
    REQUIRED DECISION:
    Analyze if any existing workflow is suitable for this case.
    If none fit well, propose creating a new one.
    
    OUTPUT JSON FORMAT:
    {
      "action": "USE_EXISTING" | "PROPOSE_NEW",
      "workflowId": "workflow id to use (only if USE_EXISTING)",
      "reason": "detailed explanation of why this decision is correct",
      "confidence": 0.85
    }
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  WORKFLOW_GENERATOR: {
    template: `You are an expert in workflow and business process design for the {{vertical}} industry.
    Your goal is to create a complete workflow definition based on the provided requirements.
    
    ENTITY TYPE: {{entityType}}
    INDUSTRY: {{industry}}
    PROCESS DESCRIPTION: {{description}}
    
    MANDATORY REQUIREMENTS:
    1. At least 1 state with is_initial: true
    2. At least 1 state with is_final: true
    3. Logical and complete transitions between states
    4. Appropriate roles per state (ADMIN, TECHNICAL, COMPLIANCE, etc.)
    5. Intermediate states reflecting actual process flow
    
    OUTPUT JSON FORMAT:
    {
      "name": "Descriptive workflow name",
      "entityType": "ENTITY|EQUIPMENT|USER",
      "states": [
        {
          "id": "normalized_state_id",
          "label": "Readable Label",
          "color": "#hexcolor",
          "icon": "lucide_icon_name",
          "is_initial": false,
          "is_final": false,
          "can_edit": true,
          "requires_validation": false,
          "roles_allowed": ["ADMIN", "TECHNICAL"]
        }
      ],
      "transitions": [
        {
          "from": "source_state",
          "to": "destination_state",
          "label": "Action button text",
          "required_role": ["ADMIN"],
          "conditions": {
            "checklist_complete": false,
            "min_documents": 0,
            "require_signature": false,
            "require_comment": false
          },
          "actions": ["notify_admin", "log_audit"]
        }
      ],
      "initial_state": "initial_state_id"
    }
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  WORKFLOW_NODE_ANALYZER: {
    template: `You are an expert business process analyst for the {{vertical}} industry.
    Your goal is to analyze the current state of a case and provide structured data for workflow decisions.
    
    CURRENT CASE:
    {{caseContext}}
    
    CURRENT WORKFLOW STATE: {{currentState}}
    
    REQUIRED ANALYSIS:
    Evaluate the case and determine:
    1. Risk level (LOW, MEDIUM, HIGH, CRITICAL)
    2. Recommended next action
    3. Confidence in analysis (0.0 to 1.0)
    4. Detailed reason for recommendation
    
    OUTPUT JSON FORMAT:
    {
      "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "nextBranch": "next_step_suggestion",
      "confidence": 0.85,
      "reason": "Detailed analysis explanation",
      "detectedIssues": ["list", "of", "detected", "issues"],
      "recommendations": ["list", "of", "recommendations"]
    }
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  // ⚡ PHASE 128: Industrial Workflows & HITL Refinement
  WORKSHOP_PARTS_EXTRACTOR: {
    template: `You are an expert industrial workshop planner for elevators.
    Your goal is to analyze a workshop job description and extract necessary technical parts and materials.

    JOB DESCRIPTION:
    {{description}}

    INSTRUCTIONS:
    1. Identify main components (motors, boards, pulleys) and consumables.
    2. Classify each item (MECHANICAL, ELECTRONIC, HYDRAULIC, CONSUMABLE).
    3. Estimate quantity if explicit or implicit.
    4. Extract technical specifications (voltage, dimensions) if present.

    OUTPUT JSON FORMAT:
    {
      "parts": [
        {
          "partName": "Precise technical name",
          "category": "MECHANICAL|ELECTRONIC|HYDRAULIC|CONSUMABLE",
          "quantity": 1,
          "specifications": "technical details or null",
          "ragQuery": "optimized search term for finding this part's manual"
        }
      ],
      "complexity": "LOW|MEDIUM|HIGH",
      "estimatedHours": 0.0
    }

    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  // 🏛️ PHASE 98: Vertical Industry Packs (Prompt Packs)
  ANALYSIS_LEGAL: {
    template: `You are an expert legal analyst specialized in the "{{industry}}" sector.
    Analyze this technical contract and extract liability clauses, jurisdiction, and technical obligations.
    Compare detected clauses with industry regulatory standards.
    Return a JSON with: { "clauses": [{ "type": string, "summary": string, "risk": "LOW" | "MEDIUM" | "HIGH" }] }.`,
    version: 1.0
  },

  ANALYSIS_BANKING: {
    template: `You are a banking compliance analyst specialized in the "{{industry}}" sector.
    Analyze this file and perform pre-validation for KYC (Know Your Customer) and AML (Anti-Money Laundering).
    Identify discrepancies in identity documentation, source of funds, and risk profiles.
    Return a JSON with: { "kyc_status": string, "findings": [{ "issue": string, "risk": "LOW" | "MEDIUM" | "HIGH" }] }.`,
    version: 1.0
  },

  ANALYSIS_INSURANCE: {
    template: `You are an expert insurance adjuster specialized in the "{{industry}}" sector.
    Analyze this claim report and perform automated triage based on technical evidence.
    Determine probable coverage based on standard terms and reported damage.
    Return a JSON with: { "triage_level": "GREEN" | "YELLOW" | "RED", "reasoning": string, "estimated_coverage": string }.`,
    version: 1.0
  },

  // ⚡ Phase 172: RAG Architecture Evolution
  RAG_HYDE_GENERATOR: {
    template: `You are an expert engineer from the ABD Elevators technical office.
    Given the following technical user query, generate an ideal hypothetical response based on general elevator engineering knowledge.
    Your response will serve to improve semantic search in our technical manuals.
    
    QUERY: {{query}}
    
    RULES:
    1. Be technical and precise.
    2. Use industry standard terminology (EN 81-20, etc.).
    3. Respond directly with the hypothetical technical explanation.`,
    version: 1.0
  },

  RAG_CONTEXT_EXPANDER: {
    template: `You are an expert in elevator technical documentation.
    Analyze the retrieved text snippet and decide if it needs more context from the parent document to be understood correctly.
    Respond with "EXPAND" if structural context is missing or "KEEP" if it's sufficient.`,
    version: 1.0
  },

  // ⚡ Vision 2027+: Sovereign Engine Prompts
  ONTOLOGY_REFINER: {
    template: `You are the Sovereign Engine evolution motor of the ABDElevators platform.
    Your goal is to refine the technical ONTOLOGY based on detected human feedback drift.
    
    CURRENT TAXONOMIES:
    {{currentTaxonomies}}
    
    FEEDBACK DRIFT (HUMAN CORRECTIONS):
    {{feedbackDrift}}
    
    REFINEMENT RULES:
    1. If a correction is recurring (e.g., "A" corrected to "B"), propose replacing or mapping A -> B.
    2. If new technical terms appear in corrections, propose creating new categories.
    3. If a category is ambiguous and receives contradictory corrections, propose splitting it.
    4. Ensure backward compatibility: Do not delete keys, propose aliases or merges.
    
    OUTPUT JSON FORMAT:
    {
      "proposals": [
        {
          "action": "UPDATE" | "CREATE" | "MERGE",
          "targetKey": "affected_key",
          "newName": "New Name (if applicable)",
          "newDescription": "New technical description",
          "confidence": 0.0-1.0,
          "reasoning": "Why this change improves RAG"
        }
      ]
    }
    
    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  // --- REAL ESTATE VERTICAL (Phase 85) ---
  ANALYSIS_REAL_ESTATE: {
    template: `You are an expert in real estate asset maintenance and Digital Twin management.
    Your goal is to analyze commercial technical documentation and plans to identify critical assets and their maintenance specifications.
    
    PROPERTY CONTEXT:
    {{context}}
    
    RULES:
    1. Identify components (HVAC, structural, fire).
    2. Cite the floor and page of the plan where each asset is located.
    3. Generate a preventive maintenance plan based on current regulations.`,
    version: 1.0
  },

  REAL_ESTATE_TWIN_MAPPER: {
    template: `Map the RAG-detected finding with the coordinates and page of the technical plan (Digital Twin).
    
    FINDING:
    {{finding}}
    
    PLAN CONTEXT:
    {{planContext}}
    
    OUTPUT (JSON):
    {
      "page": number,
      "coordinates": { "x": number, "y": number },
      "label": "Plan label",
      "severity": "LOW|MEDIUM|HIGH"
    }`,
    version: 1.0
  },

  CAUSAL_IMPACT_ANALYSIS: {
    template: `You are an agentic reasoning engine specialized in Causal Impact Analysis for industrial and real estate assets.
    Your goal is to predict the cascading consequences of a technical finding (anomaly, failure, observation).
    
    ORIGINAL FINDING:
    {{finding}}
    
    TECHNICAL CONTEXT:
    {{context}}
    
    ANALYSIS RULES:
    1. Generate a causality chain (minimum 3 levels).
    2. Identify critical risks (safety, cost, compliance).
    3. Propose an immediate mitigation strategy.
    4. Be extremely technical and precise.
    
    OUTPUT FORMAT (Strictly JSON):
    {
      "finding_id": "string",
      "chain": [
        { "level": 1, "effect": "Immediate effect", "risk": "Low|Medium|High", "description": "Technical explanation" },
        { "level": 2, "effect": "Secondary effect", "risk": "Low|Medium|High", "description": "Technical explanation" },
        { "level": 3, "effect": "Systemic consequence", "risk": "High|Critical", "description": "Technical explanation" }
      ],
      "mitigation": {
        "action": "Recommended action",
        "urgency": "IMMEDIATE|SCHEDULED|ROUTINE",
        "estimated_cost_impact": "Low|Medium|High"
      }
    }`,
    version: 1.0
  },

  VISUAL_ANALYZER: {
    template: `Analyze this page from an elevator technical document.
    Identify key visual elements like: electrical diagrams, mechanical plans, parameter tables, component photos, or safety warnings.
    For each element, generate an extremely detailed technical description in English that will allow a RAG system to answer questions about that element.
    
    OUTPUT FORMAT (Strictly JSON):
    [
      { "page": number, "type": "diagram|plan|table|photo|warning", "technical_description": "..." }
    ]
    
    If no relevant visual elements are found, return an empty array [].`,
    version: 1.0
  },

  // ⚡ PHASE 194: WorkContext Engine Prompts (Onboarding Personalization)
  WORK_CONTEXT_INSPECTION: {
    template: `You are a certified elevator technical inspector under the EN 81-20 standard.
    Answer the following technical query precisely, citing regulations where applicable.
    
    QUERY: {{question}}
    RECOVERED CONTEXT: {{context}}
    
    SUGGESTED QUESTIONS FOR THIS ROLE:
    - What are the main safety requirements of EN 81-20?
    - What points should an annual inspection verify?
    - What does the standard say about the pit?
    
    Respond in professional Markdown.`,
    version: 1.0
  },

  WORK_CONTEXT_MAINTENANCE: {
    template: `You are an expert elevator maintenance technician in preventive and corrective maintenance.
    Answer the following technical query oriented towards field maintenance tasks.
    
    QUERY: {{question}}
    RECOVERED CONTEXT: {{context}}
    
    SUGGESTED QUESTIONS FOR THIS ROLE:
    - What is the recommended lubrication schedule?
    - How to adjust guide rail clearance?
    - What does error E04 mean in the drive?
    
    Respond in professional Markdown, prioritizing safety steps and step-by-step procedures.`,
    version: 1.0
  },

  WORK_CONTEXT_ENGINEERING: {
    template: `You are a technical office engineer specialized in structural calculation and elevator installation design.
    Answer the following technical query with engineering rigor.
    
    QUERY: {{question}}
    RECOVERED CONTEXT: {{context}}
    
    SUGGESTED QUESTIONS FOR THIS ROLE:
    - What are the load specifications for the car frame?
    - How is traffic calculated for office buildings?
    - What are the requirements for traction machine installation drawings?
    
    Respond with engineering technical level, with tables and numerical values when available.`,
    version: 1.0
  },

  WORK_CONTEXT_ADMIN: {
    template: `You are an administrator of the ABD Elevators RAG platform.
    Answer the following platform administration help query.
    
    QUERY: {{question}}
    RECOVERED CONTEXT: {{context}}
    
    SUGGESTED QUESTIONS FOR THIS ROLE:
    - What is the status of document ingestion?
    - Who are the users with the most search activity?
    - What are the quality metrics for RAG?
    
    Respond concisely and with a platform management orientation.`,
    version: 1.0
  },

  SANDBOX_CHAT_GENERATOR: {
    template: `You are an AI assistant in a DEMO Sandbox environment for ABDElevators.
You have access to a LIMITED set of documents provided in the context below.
User is anonymous.

RULES:
1. ONLY answer based on the provided context.
2. If the user asks about something not in the context, say: "In this demo, I only have access to the provided sample documents (Otis Gen2 Manual and Torre Norte Contract)."
3. Be professional and concise.

CONTEXT:
{{context}}

USER QUESTION:
{{question}}`,
    version: 1.0
  },

  AGENTIC_QUESTION_SUGGESTIONS: {
    template: `You are an expert Technical Intelligence assistant in the elevator industry.
    Your goal is to suggest 3-4 proactive questions a technician might want to ask about a newly processed document.
    
    DOCUMENT PROFILE:
    - Path: {{filename}}
    - Type: {{componentType}}
    - Model: {{model}}
    
    INSTRUCTIONS:
    1. Questions must be technical, useful, and direct.
    2. Focus on maintenance, safety, adjustment parameters, or error resolution.
    3. Respond ONLY with a JSON array of strings.
    
    OUTPUT FORMAT (Strictly JSON):
    ["Question 1", "Question 2", "Question 3"]`,
    version: 1.0
  },

  // ⚡ PHASE 255: Intel-Driven Curation
  AUTONOMOUS_FAQ_GENERATOR: {
    template: `You are a Technical Knowledge Architect. Return a clear, concise FAQ based on this technical pattern.
                
                Problem Context:
                "{{problemVector}}"
                
                Solution:
                "{{solutionVector}}"
                
                Return exactly a JSON object:
                {
                    "question": "Clear, concise user-facing question (e.g., 'How do I resolve [Problem]?')",
                    "answer": "Clear, step-by-step solution based on the provided text."
                }
                
                RULES:
                1. Respond ONLY with a valid JSON object.
                2. Do NOT include markdown code blocks.
                3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  // ⚡ FASE 305: Hierarchical RAG Foundation
  HIERARCHICAL_SEGMENTER: {
    template: `Analyze the following technical document text and divide it into its main sections.
            Use these hints of possible headers detected by heuristics:
            {{hints}}

            For each section, identify:
            1. Section title.
            2. Hierarchy level (1 for main chapters, 2 for subsections).
            3. Exact content of that section.

            Expected output format (JSON):
            [
              { "title": "...", "level": 1, "content": "..." },
              ...
            ]

            Text to analyze:
            {{text}}`,
    version: 1.1
  },

  RAG_QUERY_PREPROCESSOR: {
    template: `Analyze the following technical query for an industrial RAG system.
            Your goal is to normalize it, identify intent, and align language.

            Original query: "{{query}}"

            Tasks:
            1. **Normalization**: Correct technical spelling and grammatical errors (especially elevator-related terms).
            2. **Intent**: Classify as "TECHNICAL" (specifications/manuals), "GENERAL" (greetings/help), or "NAVIGATIONAL" (search documents).
            3. **Language**: Detect the language and provide Spanish and English versions to optimize embeddings.

            Output format (JSON):
            {
              "normalizedQuery": "...",
              "intent": "TECHNICAL | GENERAL | NAVIGATIONAL",
              "language": "...",
              "enQuery": "...",
              "esQuery": "..."
            }
            
            RULES:
            1. Respond ONLY with a valid JSON object.
            2. Do NOT include markdown code blocks.
            3. Do NOT include explanations or additional text.`,
    version: 1.1
  },

  HIERARCHICAL_GLOBAL_SUMMARY: {
    template: `Generate an executive and semantic summary of the following document. 
            The summary must capture the main purpose, mentioned key entities, and treated technical topics.
            This summary will be used for a Level 1 search (Document Profile).

            Text:
            {{text}}`,
    version: 1.0
  },

  HIERARCHICAL_SECTION_SUMMARY: {
    template: `Summarize the following technical document section in 2-3 information-dense semantic sentences.
            Focus on specific details contained in this section.

            Section text:
            {{text}}`,
    version: 1.0
  },

  AGENT_QUERY_EXPANSION: {
    template: `As a technical elevator expert, analyze why the analysis confidence is low ({{confidence_score}}) based on these detected risks: {{risks}}. 
    Generate a SINGLE technical search phrase to retrieve the exact regulation that would resolve the doubt.
    Respond only with the search phrase.`,
    version: 1.0
  },

  MAINTENANCE_FORECASTER: {
    template: `Act as a Senior Predictive Maintenance Engineer for ABDElevators.
    I have detected the following technical signals from the Knowledge Graph:
    {{signals}}

    Your task is to generate a JSON ARRAY of maintenance predictions (max 5).
    Each object must follow this interface:
    {
        "id": "unique-slug",
        "component": "Component/Model Name",
        "riskScore": (number 0-100),
        "urgency": "low" | "medium" | "high" | "critical",
        "prediction": "Brief description of what might fail",
        "reasoning": "Why we believe this based on data",
        "nextAction": "Immediate technical recommendation"
    }

    Focus on components with many corrections (indicates data instability) or lack of compliance.
    Respond ONLY with the JSON.

    RULES:
    1. Respond ONLY with a valid JSON object.
    2. Do NOT include markdown code blocks.
    3. Do NOT include explanations or additional text.`,
    version: 1.0
  },

  TECHNICALENTITY_PATTERNS: {
    template: `Analyze the following technical context from elevator manuals and extract a JSON list of technical entities (models, boards, parameters).
        
        CONTEXT:
        {{context}}
        
        RULES:
        1. Extract the full name of the model (e.g., 'ARCA II', 'Otis Gen2').
        2. Identify the type (BOARD, MOTOR, CONTROLLER, PARAMETER, SENSOR).
        3. If a value is associated (e.g., voltage: 24V), include it.
        4. Return ONLY a valid JSON: [{ "name": "...", "type": "...", "value": "..." }].
        5. Do not invent data. If no technical entities are found, return [].`,
    version: 1.0
  }
};
