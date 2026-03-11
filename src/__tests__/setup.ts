import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks for Vitest
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '',
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({
        relativeTime: (date: Date) => date.toISOString(),
        dateTime: (date: Date) => date.toISOString(),
    }),
}));
