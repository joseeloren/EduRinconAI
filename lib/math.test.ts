import { describe, it, expect } from 'vitest';
import { add } from './math';

describe('Math utilities', () => {
    it('should add two numbers correctly', () => {
        expect(add(2, 3)).toBe(5);
        expect(add(-1, 1)).toBe(0);
    });
});
