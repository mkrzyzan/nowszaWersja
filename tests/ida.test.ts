/**
 * Tests for IDA (Instant Declarative Actions) implementation
 */

import { describe, test, expect } from 'bun:test';
import { runIDA, type Step, type Vars } from '../src/ida';

describe('IDA - Instant Declarative Actions', () => {
  
  describe('set action', () => {
    test('should set a numeric variable', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'x', value: 42 }
      ];
      
      const result = await runIDA(steps);
      expect(result.x).toBe(42);
    });
    
    test('should set a string variable', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'name', value: 'Alice' }
      ];
      
      const result = await runIDA(steps);
      expect(result.name).toBe('Alice');
    });
    
    test('should set a boolean variable', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'isActive', value: true }
      ];
      
      const result = await runIDA(steps);
      expect(result.isActive).toBe(true);
    });
    
    test('should overwrite existing variable', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'x', value: 10 },
        { action: 'set', var: 'x', value: 20 }
      ];
      
      const result = await runIDA(steps);
      expect(result.x).toBe(20);
    });
  });
  
  describe('compute action', () => {
    test('should compute simple addition', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'a', value: 5 },
        { action: 'set', var: 'b', value: 3 },
        { action: 'compute', var: 'sum', expr: 'a + b' }
      ];
      
      const result = await runIDA(steps);
      expect(result.sum).toBe(8);
    });
    
    test('should compute with subtraction', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'a', value: 10 },
        { action: 'set', var: 'b', value: 3 },
        { action: 'compute', var: 'diff', expr: 'a - b' }
      ];
      
      const result = await runIDA(steps);
      expect(result.diff).toBe(7);
    });
    
    test('should compute with multiplication', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'x', value: 4 },
        { action: 'set', var: 'y', value: 5 },
        { action: 'compute', var: 'product', expr: 'x * y' }
      ];
      
      const result = await runIDA(steps);
      expect(result.product).toBe(20);
    });
    
    test('should compute with division', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'a', value: 20 },
        { action: 'set', var: 'b', value: 4 },
        { action: 'compute', var: 'quotient', expr: 'a / b' }
      ];
      
      const result = await runIDA(steps);
      expect(result.quotient).toBe(5);
    });
    
    test('should respect operator precedence', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: '2 + 3 * 4' }
      ];
      
      const result = await runIDA(steps);
      expect(result.result).toBe(14);
    });
    
    test('should handle parentheses', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: '(2 + 3) * 4' }
      ];
      
      const result = await runIDA(steps);
      expect(result.result).toBe(20);
    });
    
    test('should handle nested parentheses', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: '((2 + 3) * 4) - 5' }
      ];
      
      const result = await runIDA(steps);
      expect(result.result).toBe(15);
    });
    
    test('should handle floating point numbers', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: '10.5 + 2.5' }
      ];
      
      const result = await runIDA(steps);
      expect(result.result).toBe(13);
    });
    
    test('should throw on unknown variable', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: 'unknown + 5' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('Unknown variable: unknown');
    });
    
    test('should throw on division by zero', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: '10 / 0' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('Division by zero');
    });
    
    test('should throw on non-numeric variable in expression', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'name', value: 'Alice' },
        { action: 'compute', var: 'result', expr: 'name + 5' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('not a number');
    });
  });
  
  describe('log action', () => {
    test('should log plain message', async () => {
      const steps: Step[] = [
        { action: 'log', message: 'Hello World' }
      ];
      
      // Should not throw
      await runIDA(steps);
    });
    
    test('should interpolate variables', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'x', value: 42 },
        { action: 'log', message: 'The answer is ${x}' }
      ];
      
      // Should not throw
      await runIDA(steps);
    });
    
    test('should handle missing variables in template', async () => {
      const steps: Step[] = [
        { action: 'log', message: 'Value: ${missing}' }
      ];
      
      // Should not throw, leaves placeholder intact
      await runIDA(steps);
    });
  });
  
  describe('wait action', () => {
    test('should wait for specified milliseconds', async () => {
      const start = Date.now();
      
      const steps: Step[] = [
        { action: 'wait', ms: 50 }
      ];
      
      await runIDA(steps);
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some variance
    });
    
    test('should throw on negative wait time', async () => {
      const steps: Step[] = [
        { action: 'wait', ms: -100 }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('non-negative');
    });
  });
  
  describe('initial variables', () => {
    test('should use initial variables', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'result', expr: 'x + y' }
      ];
      
      const initialVars: Vars = { x: 10, y: 20 };
      const result = await runIDA(steps, initialVars);
      
      expect(result.result).toBe(30);
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });
    
    test('should not mutate initial variables object', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'newVar', value: 100 }
      ];
      
      const initialVars: Vars = { x: 10 };
      await runIDA(steps, initialVars);
      
      expect(initialVars).toEqual({ x: 10 });
      expect('newVar' in initialVars).toBe(false);
    });
  });
  
  describe('options and safety', () => {
    test('should respect maxSteps limit', async () => {
      const steps: Step[] = Array(10).fill({ action: 'set', var: 'x', value: 1 });
      
      await expect(runIDA(steps, {}, { maxSteps: 5 })).rejects.toThrow('Too many steps');
    });
    
    test('should enforce timeout', async () => {
      const steps: Step[] = [
        { action: 'wait', ms: 1000 }
      ];
      
      await expect(runIDA(steps, {}, { timeoutMs: 100 })).rejects.toThrow('timeout');
    });
    
    test('should throw on invalid step structure', async () => {
      const steps: any[] = [
        { action: 'invalid' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('unknown action');
    });
    
    test('should throw on missing required fields', async () => {
      const steps: any[] = [
        { action: 'set' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow();
    });
  });
  
  describe('complex scenarios', () => {
    test('should execute multi-step calculation', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'width', value: 10 },
        { action: 'set', var: 'height', value: 5 },
        { action: 'compute', var: 'area', expr: 'width * height' },
        { action: 'compute', var: 'perimeter', expr: '(width + height) * 2' },
        { action: 'log', message: 'Area: ${area}, Perimeter: ${perimeter}' }
      ];
      
      const result = await runIDA(steps);
      
      expect(result.width).toBe(10);
      expect(result.height).toBe(5);
      expect(result.area).toBe(50);
      expect(result.perimeter).toBe(30);
    });
    
    test('should handle sequential computations', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'x', value: 1 },
        { action: 'compute', var: 'x', expr: 'x + 1' },
        { action: 'compute', var: 'x', expr: 'x * 2' },
        { action: 'compute', var: 'x', expr: 'x + 3' }
      ];
      
      const result = await runIDA(steps);
      expect(result.x).toBe(7); // ((1 + 1) * 2) + 3
    });
  });
  
  describe('error reporting', () => {
    test('should include step index in error messages', async () => {
      const steps: Step[] = [
        { action: 'set', var: 'x', value: 1 },
        { action: 'compute', var: 'y', expr: 'unknown + 1' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('Step 1');
    });
    
    test('should include action type in error messages', async () => {
      const steps: Step[] = [
        { action: 'compute', var: 'y', expr: 'unknown + 1' }
      ];
      
      await expect(runIDA(steps)).rejects.toThrow('compute');
    });
  });
});
