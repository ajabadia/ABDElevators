'use client';

import React from 'react';

export default function GuardianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full animate-in fade-in duration-500">
            {children}
        </div>
    );
}
