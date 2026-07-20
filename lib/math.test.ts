import { describe, it, expect } from 'vitest';
import { add, subtract, multiply } from './math';

describe('Math utilities', () => {
    it('should add two numbers correctly', () => {
        expect(add(2, 3)).toBe(5);
        expect(add(-1, 1)).toBe(0);
    });

    it('should subtract two numbers correctly', () => {
        expect(subtract(5, 3)).toBe(2);
        expect(subtract(1, 5)).toBe(-4);
    });

    it('should multiply two numbers correctly', () => {
        expect(multiply(3, 4)).toBe(12);
        expect(multiply(-2, 5)).toBe(-10);
    });
});
