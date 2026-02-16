export interface SimulationResult {
    avg_cost: number;
    avg_time: number;
    min_cost: number;
    max_cost: number;
    iterations: number;
    completed_runs: number;
}

/**
 * Motor de Simulación Monte Carlo para Workflows.
 * Estima coste y tiempo basado en probabilidades de transición y pesos de estado.
 */
export function runWorkflowSimulation(
    nodes: any[],
    edges: any[],
    iterations: number = 1000
): SimulationResult {
    const totalCosts: number[] = [];
    const totalTimes: number[] = [];
    let completedRuns = 0;

    // Build adjacency for faster traversal
    const adjMap = new Map<string, any[]>();
    edges.forEach(edge => {
        if (!adjMap.has(edge.source)) adjMap.set(edge.source, []);
        // Find probability from edge data if available, default to 1
        const prob = edge.data?.probability ?? 1;
        adjMap.get(edge.source)!.push({ to: edge.target, prob });
    });

    const initialNode = nodes.find(n => n.data?.is_initial);
    if (!initialNode) throw new Error("No initial node found for simulation");

    for (let i = 0; i < iterations; i++) {
        let currentId = initialNode.id;
        let iterCost = 0;
        let iterTime = 0;
        let steps = 0;
        const maxSteps = 100; // Safeguard

        while (steps < maxSteps) {
            const currentNode = nodes.find(n => n.id === currentId);
            if (!currentNode) break;

            // Accumulate cost/time from state
            const stateData = currentNode.data?.simulationData || {};
            iterCost += stateData.cost_est || 0;
            iterTime += stateData.time_est || 0;

            if (currentNode.data?.is_final) {
                completedRuns++;
                break;
            }

            const transitions = adjMap.get(currentId) || [];
            if (transitions.length === 0) break;

            // Pick next state based on probabilities
            const next = pickNextState(transitions);
            if (!next) break;

            currentId = next;
            steps++;
        }

        totalCosts.push(iterCost);
        totalTimes.push(iterTime);
    }

    const avgCost = totalCosts.reduce((a, b) => a + b, 0) / iterations;
    const avgTime = totalTimes.reduce((a, b) => a + b, 0) / iterations;

    return {
        avg_cost: avgCost,
        avg_time: avgTime,
        min_cost: Math.min(...totalCosts),
        max_cost: Math.max(...totalCosts),
        iterations,
        completed_runs: completedRuns
    };
}

function pickNextState(transitions: any[]): string | null {
    const totalProb = transitions.reduce((sum, t) => sum + t.prob, 0);
    const rand = Math.random() * totalProb;
    let cum = 0;
    for (const t of transitions) {
        cum += t.prob;
        if (rand < cum) return t.to;
    }
    return transitions[0]?.to || null;
}
