import { BaseRepository, type SafeFilter, type SafeUpdate } from './BaseRepository';
import { OntologyProposal } from '@/lib/schemas/ontology-proposals';
import { TenantId } from '@/lib/schemas/common';
import { Filter } from 'mongodb';

/**
 * 🏛️ OntologyProposalRepository
 * Era 16: Access point for ontology refinement proposals.
 */
export class OntologyProposalRepository extends BaseRepository<OntologyProposal> {
    constructor() {
        super('ontology_proposals', 'MAIN');
    }

    async createProposal(proposal: OntologyProposal): Promise<string> {
        return await this.create(proposal) as string;
    }

    async findPending(tenantId: TenantId): Promise<OntologyProposal[]> {
        return await this.find({ tenantId, status: 'PENDING' });
    }

    async updateStatus(proposalId: string, status: string, reviewer?: string): Promise<boolean> {
        return await this.update(proposalId, { 
            $set: { 
                status, 
                reviewedBy: reviewer, 
                reviewedAt: new Date() 
            } 
        });
    }
}

export const ontologyProposalRepository = new OntologyProposalRepository();
