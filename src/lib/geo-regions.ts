export interface GeoRegion {
    id: string;
    name: string;
    status: 'online' | 'syncing' | 'replica';
    latency: number;
}

export const MOCK_REGIONS: GeoRegion[] = [
    { id: 'eu-west', name: 'Europa (Madrid)', status: 'online', latency: 5 },
    { id: 'us-east', name: 'EE.UU (Virginia)', status: 'replica', latency: 85 },
    { id: 'as-east', name: 'Asia (Tokio)', status: 'replica', latency: 210 }
];

export function getNetworkStatus(): GeoRegion[] {
    return MOCK_REGIONS.map(r => ({
        ...r,
        latency: r.latency + Math.floor(Math.random() * 5)
    }));
}
