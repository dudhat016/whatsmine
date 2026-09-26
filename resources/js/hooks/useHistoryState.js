import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useHistoryState Hook
 * Provides undo, redo, canUndo, canRedo, history tracking, and global Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z keybindings.
 */
export function useHistoryState(initialPresent, options = {}) {
    const {
        maxHistory = 50,
        enableKeyboard = true,
        debounceMs = 250,
    } = options;

    const [past, setPast] = useState([]);
    const [present, setPresentInternal] = useState(initialPresent);
    const [future, setFuture] = useState([]);

    const presentRef = useRef(present);
    presentRef.current = present;

    const pastRef = useRef(past);
    pastRef.current = past;

    const futureRef = useRef(future);
    futureRef.current = future;

    const debounceTimerRef = useRef(null);
    const pendingSnapshotRef = useRef(null);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    const undo = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        if (pastRef.current.length === 0) return;

        const previous = pastRef.current[pastRef.current.length - 1];
        const newPast = pastRef.current.slice(0, pastRef.current.length - 1);

        setPast(newPast);
        setFuture(prev => [presentRef.current, ...prev]);
        setPresentInternal(previous);
    }, []);

    const redo = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        if (futureRef.current.length === 0) return;

        const next = futureRef.current[0];
        const newFuture = futureRef.current.slice(1);

        setPast(prev => [...prev, presentRef.current]);
        setFuture(newFuture);
        setPresentInternal(next);
    }, []);

    const set = useCallback((newValOrUpdater, isDebounced = false) => {
        setPresentInternal(currentPresent => {
            const nextPresent = typeof newValOrUpdater === 'function' ? newValOrUpdater(currentPresent) : newValOrUpdater;

            // Skip if identical
            try {
                if (JSON.stringify(currentPresent) === JSON.stringify(nextPresent)) {
                    return currentPresent;
                }
            } catch (e) {
                // If circular or fails JSON.stringify, continue
            }

            if (isDebounced && debounceMs > 0) {
                if (!pendingSnapshotRef.current) {
                    pendingSnapshotRef.current = currentPresent;
                }
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    if (pendingSnapshotRef.current) {
                        const snapshot = pendingSnapshotRef.current;
                        pendingSnapshotRef.current = null;
                        setPast(prevPast => [...prevPast.slice(-maxHistory + 1), snapshot]);
                        setFuture([]);
                    }
                }, debounceMs);
            } else {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                    debounceTimerRef.current = null;
                    pendingSnapshotRef.current = null;
                }
                setPast(prevPast => [...prevPast.slice(-maxHistory + 1), currentPresent]);
                setFuture([]);
            }

            return nextPresent;
        });
    }, [maxHistory, debounceMs]);

    // Keyboard listener for Ctrl+Z and Ctrl+Y / Ctrl+Shift+Z / Cmd+Z / Cmd+Shift+Z
    useEffect(() => {
        if (!enableKeyboard) return;

        const handleKeyDown = (e) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (!isCtrlOrCmd) return;

            const key = e.key.toLowerCase();
            if (key !== 'z' && key !== 'y') return;

            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            // If focused in an editable text input that is not readonly, let native text undo take precedence
            // unless the active input is in the sidebar settings or builder controls where state undo is expected
            if (isInput && !activeEl.readOnly && !activeEl.dataset.builderInput) {
                // allow normal input undo
                return;
            }

            if (key === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    redo();
                } else {
                    e.preventDefault();
                    undo();
                }
            } else if (key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enableKeyboard, undo, redo]);

    return [present, set, { undo, redo, canUndo, canRedo, setPast, setFuture, past, future }];
}

export default useHistoryState;
