# Graph RAG - Pending Development

**Status:** Experimental / Not Production Ready  
**Moved:** 2026-02-10  
**Original Location:** `src/services/`

---

## 📁 Files in This Folder

1. **`graph-extraction-service.ts`** - Entity/relationship extraction using Gemini + Neo4j
2. **`graph-retrieval-service.ts`** - Graph-based knowledge retrieval

---

## 🎯 What is Graph RAG?

Graph RAG is an alternative to vector-based RAG that uses knowledge graphs (Neo4j) to:
- **Extract entities** (people, organizations, concepts) from documents
- **Map relationships** between entities
- **Navigate knowledge** through graph traversal queries

### Example Use Case

**Vector RAG (current):**  
Query: "¿Qué ascensores tiene Técnico López?"  
→ Similarity search in embeddings  
→ Returns chunks mentioning "López"

**Graph RAG (future):**  
Query: "¿Qué ascensores tiene Técnico López?"  
→ Finds entity `Persona:López`  
→ Traverses edges: `López -[INSTALA]-> Motor:ABC`  
→ Returns: "López instaló motor ABC en edificio Central"

---

## 🚧 Why Not Production-Ready?

- **Neo4j dependency:** Not configured in production environment
- **Complexity:** Requires graph DB maintenance, schema management
- **Performance:** Untested at scale
- **Cost:** Additional infrastructure (Neo4j Cloud or self-hosted)

---

## 🔄 How to Reactivate

### Prerequisites

1. **Neo4j Instance:**
   ```bash
   # Docker (local dev)
   docker run -d \
     --name neo4j \
     -p 7474:7474 -p 7687:7687 \
     -e NEO4J_AUTH=neo4j/password \
     neo4j:latest
   ```

2. **Environment Variables:**
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=password
   ```

3. **Move Files Back:**
   ```bash
   mv src/services/pendientes/graph-rag/*.ts src/services/
   ```

### Integration Points

**Existing Code References:**

1. **`lib/rag-service.ts:201`** - Inactive Graph RAG path
   ```typescript
   if (graphMode === 'GRAPH_ONLY') { // Currently never true
     const { GraphRetrievalService } = await import('@/services/graph-retrieval-service');
     // ...
   }
   ```

2. **Test Script:** `scripts/verify-graph-rag.ts`

### Implementation Roadmap

See `ROADMAP_MASTER.md` → **Future Phase: Graph RAG Implementation**

---

## 📚 References

- **Neo4j Docs:** https://neo4j.com/docs/
- **Graph RAG Paper:** https://arxiv.org/abs/2404.16130
- **LangChain Graph Chains:** https://python.langchain.com/docs/use_cases/graph/

---

## 📝 Notes

- These services were developed during Phase 86 (experimental)
- Never deployed to production
- Can be safely restored from git history if needed
