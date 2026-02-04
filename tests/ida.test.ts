/**
 * Tests for IDA - Instant Declarative Actions
 */

import { describe, test, expect } from 'bun:test';
import { runIDA, type Step, type Vars } from '../src/ida';

describe('IDA Runner', () => {
  test('should execute set action', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'x', value: 42 },
      { action: 'set', var: 'name', value: 'Alice' },
      { action: 'set', var: 'active', value: true },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.x).toBe(42);
    expect(result.name).toBe('Alice');
    expect(result.active).toBe(true);
  });
  
  test('should execute log action with template interpolation', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'user', value: 'Bob' },
      { action: 'set', var: 'count', value: 3 },
      { action: 'log', message: 'Hello ${user}, count is ${count}' },
    ];
    
    // Log action doesn't fail, just outputs to console
    const result = await runIDA(steps);
    
    expect(result.user).toBe('Bob');
    expect(result.count).toBe(3);
  });
  
  test('should execute compute action with simple expression', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'a', value: 10 },
      { action: 'set', var: 'b', value: 5 },
      { action: 'compute', var: 'sum', expr: 'a + b' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.sum).toBe(15);
  });
  
  test('should execute compute action with complex expression', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'x', value: 10 },
      { action: 'set', var: 'y', value: 5 },
      { action: 'compute', var: 'result', expr: '(x + y) * 2' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.result).toBe(30);
  });
  
  test('should execute compute with all operators', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'a', value: 20 },
      { action: 'set', var: 'b', value: 5 },
      { action: 'compute', var: 'add', expr: 'a + b' },
      { action: 'compute', var: 'sub', expr: 'a - b' },
      { action: 'compute', var: 'mul', expr: 'a * b' },
      { action: 'compute', var: 'div', expr: 'a / b' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.add).toBe(25);
    expect(result.sub).toBe(15);
    expect(result.mul).toBe(100);
    expect(result.div).toBe(4);
  });
  
  test('should respect operator precedence', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'a', value: 2 },
      { action: 'set', var: 'b', value: 3 },
      { action: 'set', var: 'c', value: 4 },
      { action: 'compute', var: 'result', expr: 'a + b * c' },
    ];
    
    const result = await runIDA(steps);
    
    // Should be 2 + (3 * 4) = 14, not (2 + 3) * 4 = 20
    expect(result.result).toBe(14);
  });
  
  test('should handle parentheses correctly', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'a', value: 2 },
      { action: 'set', var: 'b', value: 3 },
      { action: 'set', var: 'c', value: 4 },
      { action: 'compute', var: 'result', expr: '(a + b) * c' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.result).toBe(20);
  });
  
  test('should execute wait action', async () => {
    const start = Date.now();
    
    const steps: Step[] = [
      { action: 'wait', ms: 50 },
    ];
    
    await runIDA(steps);
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some margin
  });
  
  test('should use initial variables', async () => {
    const steps: Step[] = [
      { action: 'compute', var: 'result', expr: 'initial + 10' },
    ];
    
    const initialVars: Vars = { initial: 5 };
    const result = await runIDA(steps, initialVars);
    
    expect(result.result).toBe(15);
    expect(result.initial).toBe(5);
  });
  
  test('should throw error on unknown variable in log', async () => {
    const steps: Step[] = [
      { action: 'log', message: 'Value: ${unknown}' },
    ];
    
    await expect(runIDA(steps)).rejects.toThrow('Unknown variable');
  });
  
  test('should throw error on unknown variable in compute', async () => {
    const steps: Step[] = [
      { action: 'compute', var: 'result', expr: 'unknown + 1' },
    ];
    
    await expect(runIDA(steps)).rejects.toThrow('Unknown variable');
  });
  
  test('should throw error on non-numeric variable in compute', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'str', value: 'hello' },
      { action: 'compute', var: 'result', expr: 'str + 1' },
    ];
    
    await expect(runIDA(steps)).rejects.toThrow('not a number');
  });
  
  test('should throw error on division by zero', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'x', value: 10 },
      { action: 'set', var: 'zero', value: 0 },
      { action: 'compute', var: 'result', expr: 'x / zero' },
    ];
    
    await expect(runIDA(steps)).rejects.toThrow('Division by zero');
  });
  
  test('should throw error on invalid step action', async () => {
    const steps = [
      { action: 'invalid' },
    ] as unknown as Step[];
    
    await expect(runIDA(steps)).rejects.toThrow('unknown action');
  });
  
  test('should throw error on missing required field', async () => {
    const steps = [
      { action: 'set', var: 'x' }, // missing value
    ] as unknown as Step[];
    
    await expect(runIDA(steps)).rejects.toThrow();
  });
  
  test('should enforce max steps limit', async () => {
    const steps: Step[] = Array(10).fill({ action: 'set', var: 'x', value: 1 });
    
    await expect(runIDA(steps, {}, { maxSteps: 5 })).rejects.toThrow('Too many steps');
  });
  
  test('should enforce timeout', async () => {
    const steps: Step[] = [
      { action: 'wait', ms: 1000 }, // Wait 1 second
    ];
    
    await expect(runIDA(steps, {}, { timeoutMs: 50 })).rejects.toThrow('timeout');
  });
  
  test('should handle malformed expression', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'x', value: 5 },
      { action: 'compute', var: 'result', expr: 'x +' }, // Incomplete expression
    ];
    
    await expect(runIDA(steps)).rejects.toThrow();
  });
  
  test('should handle mismatched parentheses', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'x', value: 5 },
      { action: 'compute', var: 'result', expr: '(x + 1' }, // Missing closing paren
    ];
    
    await expect(runIDA(steps)).rejects.toThrow('parentheses');
  });
  
  test('should handle nested parentheses', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'a', value: 2 },
      { action: 'set', var: 'b', value: 3 },
      { action: 'set', var: 'c', value: 4 },
      { action: 'compute', var: 'result', expr: '((a + b) * c) / 2' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.result).toBe(10);
  });
  
  test('should handle decimal numbers', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'pi', value: 3.14159 },
      { action: 'set', var: 'radius', value: 2.5 },
      { action: 'compute', var: 'area', expr: 'pi * radius * radius' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.area).toBeCloseTo(19.635, 2);
  });
  
  test('should not mutate initial variables', async () => {
    const initialVars: Vars = { x: 10 };
    const steps: Step[] = [
      { action: 'set', var: 'x', value: 20 },
    ];
    
    const result = await runIDA(steps, initialVars);
    
    expect(result.x).toBe(20);
    expect(initialVars.x).toBe(10); // Original not mutated
  });
  
  test('should execute complete workflow', async () => {
    const steps: Step[] = [
      { action: 'set', var: 'price', value: 100 },
      { action: 'set', var: 'quantity', value: 3 },
      { action: 'compute', var: 'subtotal', expr: 'price * quantity' },
      { action: 'set', var: 'taxRate', value: 0.08 },
      { action: 'compute', var: 'tax', expr: 'subtotal * taxRate' },
      { action: 'compute', var: 'total', expr: 'subtotal + tax' },
      { action: 'log', message: 'Order total: $${total}' },
    ];
    
    const result = await runIDA(steps);
    
    expect(result.subtotal).toBe(300);
    expect(result.tax).toBe(24);
    expect(result.total).toBe(324);
  });
});
