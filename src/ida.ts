/**
 * IDA - Instant Declarative Actions
 * 
 * A small, safe, TypeScript declarative steps runner for executing
 * sequences of simple actions defined as JSON arrays.
 */

/**
 * Variables store for IDA runtime
 */
export type Vars = Record<string, number | string | boolean>;

/**
 * Step actions supported by IDA
 */
export type Step =
  | { action: 'log'; message: string }
  | { action: 'set'; var: string; value: number | string | boolean }
  | { action: 'compute'; var: string; expr: string }
  | { action: 'wait'; ms: number };

/**
 * Configuration options for the IDA runner
 */
export interface RunnerOptions {
  /**
   * Maximum number of steps to execute (prevents runaway scripts)
   * @default 1000
   */
  maxSteps?: number;

  /**
   * Maximum stack size for expression evaluation (prevents stack overflow)
   * @default 1000
   */
  maxStackSize?: number;

  /**
   * Optional timeout in milliseconds (aborts long-running scripts)
   */
  timeoutMs?: number;
}

/**
 * Token types for expression parsing
 */
type Token = 
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' };

/**
 * Tokenize a mathematical expression, resolving variables to numbers
 */
function tokenize(expr: string, vars: Vars): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < expr.length) {
    const char = expr[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Numbers
    if (/\d/.test(char)) {
      let numStr = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${numStr}`);
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // Operators
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'operator', value: char as '+' | '-' | '*' | '/' });
      i++;
      continue;
    }
    
    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    
    if (char === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }
    
    // Variables
    if (/[a-zA-Z_]/.test(char)) {
      let varName = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        varName += expr[i];
        i++;
      }
      
      if (!(varName in vars)) {
        throw new Error(`Unknown variable: ${varName}`);
      }
      
      const value = vars[varName];
      if (typeof value !== 'number') {
        throw new Error(`Variable ${varName} is not a number (got ${typeof value})`);
      }
      
      tokens.push({ type: 'number', value });
      continue;
    }
    
    throw new Error(`Unexpected character: ${char}`);
  }
  
  return tokens;
}

/**
 * Get operator precedence
 */
function precedence(op: string): number {
  switch (op) {
    case '+':
    case '-':
      return 1;
    case '*':
    case '/':
      return 2;
    default:
      return 0;
  }
}

/**
 * Convert infix tokens to RPN (Reverse Polish Notation) using Shunting Yard algorithm
 */
function toRPN(tokens: Token[], maxStackSize: number): Token[] {
  const output: Token[] = [];
  const operators: Token[] = [];
  
  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
    } else if (token.type === 'operator') {
      while (
        operators.length > 0 &&
        operators[operators.length - 1].type === 'operator' &&
        precedence(operators[operators.length - 1].value as string) >= precedence(token.value)
      ) {
        const op = operators.pop();
        if (op) output.push(op);
      }
      operators.push(token);
    } else if (token.type === 'lparen') {
      operators.push(token);
    } else if (token.type === 'rparen') {
      while (operators.length > 0 && operators[operators.length - 1].type !== 'lparen') {
        const op = operators.pop();
        if (op) output.push(op);
      }
      if (operators.length === 0) {
        throw new Error('Mismatched parentheses');
      }
      operators.pop(); // Remove the '('
    }
    
    if (operators.length > maxStackSize) {
      throw new Error(`Stack size exceeded ${maxStackSize}`);
    }
  }
  
  while (operators.length > 0) {
    const op = operators.pop()!;
    if (op.type === 'lparen') {
      throw new Error('Mismatched parentheses');
    }
    output.push(op);
  }
  
  return output;
}

/**
 * Evaluate RPN expression
 */
function evaluateRPN(rpn: Token[], maxStackSize: number): number {
  const stack: number[] = [];
  
  for (const token of rpn) {
    if (token.type === 'number') {
      stack.push(token.value);
    } else if (token.type === 'operator') {
      if (stack.length < 2) {
        throw new Error('Invalid expression: not enough operands');
      }
      
      const b = stack.pop()!;
      const a = stack.pop()!;
      
      switch (token.value) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          if (b === 0) {
            throw new Error('Division by zero');
          }
          stack.push(a / b);
          break;
      }
    }
    
    if (stack.length > maxStackSize) {
      throw new Error(`Stack size exceeded ${maxStackSize}`);
    }
  }
  
  if (stack.length !== 1) {
    throw new Error('Invalid expression: too many operands');
  }
  
  return stack[0];
}

/**
 * Safely compute a mathematical expression
 */
function compute(expr: string, vars: Vars, maxStackSize: number): number {
  const tokens = tokenize(expr, vars);
  const rpn = toRPN(tokens, maxStackSize);
  return evaluateRPN(rpn, maxStackSize);
}

/**
 * Replace ${varName} placeholders in a template string
 */
function interpolate(template: string, vars: Vars): string {
  return template.replace(/\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, varName) => {
    if (!(varName in vars)) {
      return match; // Keep placeholder if variable doesn't exist
    }
    return String(vars[varName]);
  });
}

/**
 * Execute a single step
 */
async function executeStep(step: Step, vars: Vars, options: Required<RunnerOptions>): Promise<void> {
  switch (step.action) {
    case 'log':
      const message = interpolate(step.message, vars);
      console.info(message);
      break;
      
    case 'set':
      if (typeof step.var !== 'string' || !step.var) {
        throw new Error('Variable name must be a non-empty string');
      }
      vars[step.var] = step.value;
      break;
      
    case 'compute':
      if (typeof step.var !== 'string' || !step.var) {
        throw new Error('Variable name must be a non-empty string');
      }
      const result = compute(step.expr, vars, options.maxStackSize);
      vars[step.var] = result;
      break;
      
    case 'wait':
      if (typeof step.ms !== 'number' || step.ms < 0) {
        throw new Error('Wait duration must be a non-negative number');
      }
      await new Promise(resolve => setTimeout(resolve, step.ms));
      break;
      
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = step;
      throw new Error(`Unknown action: ${(_exhaustive as any).action}`);
  }
}

/**
 * Validate a step object
 */
function validateStep(step: unknown, index: number): asserts step is Step {
  if (!step || typeof step !== 'object') {
    throw new Error(`Step ${index}: must be an object`);
  }
  
  const s = step as any;
  
  if (!('action' in s) || typeof s.action !== 'string') {
    throw new Error(`Step ${index}: missing or invalid 'action' field`);
  }
  
  switch (s.action) {
    case 'log':
      if (typeof s.message !== 'string') {
        throw new Error(`Step ${index}: 'log' action requires 'message' field (string)`);
      }
      break;
      
    case 'set':
      if (typeof s.var !== 'string') {
        throw new Error(`Step ${index}: 'set' action requires 'var' field (string)`);
      }
      if (!['number', 'string', 'boolean'].includes(typeof s.value)) {
        throw new Error(`Step ${index}: 'set' action requires 'value' field (number, string, or boolean)`);
      }
      break;
      
    case 'compute':
      if (typeof s.var !== 'string') {
        throw new Error(`Step ${index}: 'compute' action requires 'var' field (string)`);
      }
      if (typeof s.expr !== 'string') {
        throw new Error(`Step ${index}: 'compute' action requires 'expr' field (string)`);
      }
      break;
      
    case 'wait':
      if (typeof s.ms !== 'number') {
        throw new Error(`Step ${index}: 'wait' action requires 'ms' field (number)`);
      }
      break;
      
    default:
      throw new Error(`Step ${index}: unknown action '${s.action}'`);
  }
}

/**
 * Run IDA steps
 * 
 * Executes a sequence of declarative steps with a shared variable store.
 * 
 * @param steps - Array of step objects to execute
 * @param initialVars - Initial variable values (optional)
 * @param options - Runner configuration options (optional)
 * @returns Promise that resolves with the final variable state
 * 
 * @example
 * ```typescript
 * const steps = [
 *   { action: 'set', var: 'x', value: 10 },
 *   { action: 'compute', var: 'y', expr: 'x * 2' },
 *   { action: 'log', message: 'Result: ${y}' }
 * ];
 * 
 * const finalVars = await runIDA(steps);
 * console.log(finalVars); // { x: 10, y: 20 }
 * ```
 */
export async function runIDA(
  steps: Step[],
  initialVars: Vars = {},
  options: RunnerOptions = {}
): Promise<Vars> {
  // Set defaults
  const opts: Required<RunnerOptions> = {
    maxSteps: options.maxSteps ?? 1000,
    maxStackSize: options.maxStackSize ?? 1000,
    timeoutMs: options.timeoutMs ?? 0
  };
  
  // Validate steps array
  if (!Array.isArray(steps)) {
    throw new Error('Steps must be an array');
  }
  
  if (steps.length > opts.maxSteps) {
    throw new Error(`Too many steps: ${steps.length} (max: ${opts.maxSteps})`);
  }
  
  // Validate each step
  steps.forEach((step, index) => validateStep(step, index));
  
  // Clone initial vars to avoid mutations
  const vars: Vars = { ...initialVars };
  
  // Execute steps
  const executeSteps = async () => {
    for (let i = 0; i < steps.length; i++) {
      try {
        await executeStep(steps[i], vars, opts);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Step ${i} (${steps[i].action}): ${message}`);
      }
    }
    return vars;
  };
  
  // Execute with optional timeout
  if (opts.timeoutMs > 0) {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Execution timeout after ${opts.timeoutMs}ms`)), opts.timeoutMs);
    });
    
    return Promise.race([executeSteps(), timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }
  
  return executeSteps();
}
