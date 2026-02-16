"use client";

import { useEffect } from "react";

interface ShortcutsProps {
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

export function useWorkflowShortcuts({
    onUndo,
    onRedo,
    onSave,
    onDelete,
    onDuplicate
}: ShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const isCtrl = event.ctrlKey || event.metaKey;
            const key = event.key.toLowerCase();

            // Undo: Ctrl + Z
            if (isCtrl && key === 'z' && !event.shiftKey) {
                event.preventDefault();
                onUndo();
            }

            // Redo: Ctrl + Shift + Z or Ctrl + Y
            if ((isCtrl && event.shiftKey && key === 'z') || (isCtrl && key === 'y')) {
                event.preventDefault();
                onRedo();
            }

            // Save: Ctrl + S
            if (isCtrl && key === 's') {
                event.preventDefault();
                onSave();
            }

            // Duplicate: Ctrl + D
            if (isCtrl && key === 'd') {
                event.preventDefault();
                onDuplicate();
            }

            // Delete: Delete or Backspace (if not in input)
            if ((key === 'delete' || key === 'backspace') &&
                !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
                onDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo, onSave, onDelete, onDuplicate]);
}
