const NOTES = new Map<string, [string, string][]>();
export const motionReviseNoted = (hash: string, notes: [string, string][]): void => void NOTES.set(hash, notes);
export const motionReviseNotesOf = (hash: string | undefined): [string, string][] => (hash && NOTES.get(hash)) || [];
