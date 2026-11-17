'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';

export function useConfirm() {
    const [description, setDescription] = useState('');
    const resolver = useRef<((confirmed: boolean) => void) | null>(null);
    const finish = useCallback((value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setDescription('');
    }, []);
    useEffect(
        () => () => {
            resolver.current?.(false);
        },
        [],
    );
    const askConfirm = useCallback(
        (message: string) =>
            new Promise<boolean>((resolve) => {
                resolver.current?.(false);
                resolver.current = resolve;
                setDescription(message);
            }),
        [],
    );
    const confirmationDialog = description ? (
        <Modal
            open
            onClose={() => finish(false)}
            title="Confirm action"
            footer={
                <div className="flex gap-3">
                    <button
                        className="btn-secondary"
                        onClick={() => finish(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => finish(true)}
                    >
                        Confirm
                    </button>
                </div>
            }
        >
            <p>{description}</p>
        </Modal>
    ) : null;
    return { askConfirm, confirmationDialog };
}
