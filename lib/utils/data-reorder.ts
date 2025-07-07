import { Wedding } from '@/lib/dataTemplate';

export const reorderEvents = (events: Wedding[], startIndex: number, endIndex: number): Wedding[] => {
    const result = Array.from(events);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};