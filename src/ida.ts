/**
 * IDA - Instant Declarative Actions
 * A small, safe TypeScript declarative steps runner
 * 
 * Executes JSON-defined steps with no eval, safe expression parsing,
 * and configurable safety limits.
 */

/**
 * Variables storage - maps variable names to their values
 */
export type Vars = Record<string, number | string | boolean>;

/**
 * Log step - outputs a message with variable interpolation
 */
export interface LogStep {
  action: 'log';
  message: string;
}

/**
 * Set step - assigns a value to a variable
 */
export interface SetStep {
  action: 'set';
  var: string;
  value: number | string | boolean;
}

/**
 * Compute step - evaluates a mathematical expression and stores the result
 * Supports: numbers, variables, +, -, *, /, parentheses
 */
export interface ComputeStep {
  action: 'compute';
  var: string;
  expr: string;
}

/**
 * Wait step - async delay in milliseconds
 */
export interface WaitStep {
  action: 'wait';
  ms: number;
}

/**
 * Union of all supported step types
 */
export type Step = LogStep | SetStep | ComputeStep | WaitStep;

/**
 * Configuration options for the IDA runner
 */
export interface RunnerOptions {
  /**
   * Maximum number of steps to execute (default: 1000)
   */
  maxSteps?: number;
  
  /**
   * Maximum stack size for expression evaluation (default: 1000)
   */
  maxStackSize?: number;
  
  /**
   * Optional timeout in milliseconds for the entire run
   */
  timeoutMs?: number;
}

/**
 * Token types for expression parsing
 */
type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string | number;
}

/**
 * Safely interpolate variables in a template string
 * Supports ${varName} syntax without using eval
 */
function interpolateTemplate(template: string, vars: Vars): string {
  return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
    if (!(varName in vars)) {
      throw new Error(`Unknown variable: ${varName}`);
    }
    return String(vars[varName]);
  });
}

/**
 * Tokenize a mathematical expression
 * Replaces variable names with their numeric values during tokenization
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
    
    // Parse numbers
    if (/\d/.test(char) || (char === '.' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let numStr = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }
    
    // Parse operators
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }
    
    // Parse parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    
    // Parse variable names
    if (/[a-zA-Z_]/.test(char)) {
      let varName = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        varName += expr[i];
        i++;
      }
      
      // Replace variable with its value
      if (!(varName in vars)) {
        throw new Error(`Unknown variable in expression: ${varName}`);
      }
      
      const value = vars[varName];
      if (typeof value !== 'number') {
        throw new Error(`Variable ${varName} is not a number (got ${typeof value})`);
      }
      
      tokens.push({ type: 'NUMBER', value });
      continue;
    }
    
    throw new Error(`Invalid character in expression: ${char}`);
  }
  
  return tokens;
}

/**
 * Get operator precedence
 */
function getPrecedence(op: string): number {
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
 * Convert infix tokens to Reverse Polish Notation (RPN) using Shunting-yard algorithm
 */
function infixToRPN(tokens: Token[], maxStackSize: number): Token[] {
  const output: Token[] = [];
  const operatorStack: Token[] = [];
  
  for (const token of tokens) {
    if (operatorStack.length > maxStackSize) {
      throw new Error(`Stack size exceeded ${maxStackSize}`);
    }
    
    if (token.type === 'NUMBER') {
      output.push(token);
    } else if (token.type === 'OPERATOR') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
        getPrecedence(operatorStack[operatorStack.length - 1].value as string) >=
          getPrecedence(token.value as string)
      ) {
        output.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type !== 'LPAREN'
      ) {
        output.push(operatorStack.pop()!);
      }
      
      if (operatorStack.length === 0) {
        throw new Error('Mismatched parentheses');
      }
      
      operatorStack.pop(); // Remove the LPAREN
    }
  }
  
  // Pop remaining operators
  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op.type === 'LPAREN') {
      throw new Error('Mismatched parentheses');
    }
    output.push(op);
  }
  
  return output;
}

/**
 * Evaluate RPN expression
 */
function evaluateRPN(rpnTokens: Token[], maxStackSize: number): number {
  const stack: number[] = [];
  
  for (const token of rpnTokens) {
    if (stack.length > maxStackSize) {
      throw new Error(`Stack size exceeded ${maxStackSize}`);
    }
    
    if (token.type === 'NUMBER') {
      stack.push(token.value as number);
    } else if (token.type === 'OPERATOR') {
      if (stack.length < 2) {
        throw new Error('Invalid expression: insufficient operands');
      }
      
      const b = stack.pop()!;
      const a = stack.pop()!;
      const op = token.value as string;
      
      let result: number;
      switch (op) {
        case '+':
          result = a + b;
          break;
        case '-':
          result = a - b;
          break;
        case '*':
          result = a * b;
          break;
        case '/':
          if (b === 0) {
            throw new Error('Division by zero');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Unknown operator: ${op}`);
      }
      
      stack.push(result);
    }
  }
  
  if (stack.length !== 1) {
    throw new Error('Invalid expression: too many operands');
  }
  
  return stack[0];
}

/**
 * Evaluate a mathematical expression safely
 */
function evaluateExpression(expr: string, vars: Vars, maxStackSize: number): number {
  const tokens = tokenize(expr, vars);
  const rpnTokens = infixToRPN(tokens, maxStackSize);
  return evaluateRPN(rpnTokens, maxStackSize);
}

/**
 * Validate a step has the required shape
 */
function validateStep(step: unknown, index: number): Step {
  if (!step || typeof step !== 'object') {
    throw new Error(`Step ${index}: must be an object`);
  }
  
  const s = step as Record<string, unknown>;
  
  if (!s.action || typeof s.action !== 'string') {
    throw new Error(`Step ${index}: missing or invalid 'action' field`);
  }
  
  switch (s.action) {
    case 'log':
      if (typeof s.message !== 'string') {
        throw new Error(`Step ${index}: 'log' action requires 'message' (string)`);
      }
      return s as LogStep;
      
    case 'set':
      if (typeof s.var !== 'string') {
        throw new Error(`Step ${index}: 'set' action requires 'var' (string)`);
      }
      if (
        typeof s.value !== 'number' &&
        typeof s.value !== 'string' &&
        typeof s.value !== 'boolean'
      ) {
        throw new Error(`Step ${index}: 'set' action requires 'value' (number, string, or boolean)`);
      }
      return s as SetStep;
      
    case 'compute':
      if (typeof s.var !== 'string') {
        throw new Error(`Step ${index}: 'compute' action requires 'var' (string)`);
      }
      if (typeof s.expr !== 'string') {
        throw new Error(`Step ${index}: 'compute' action requires 'expr' (string)`);
      }
      return s as ComputeStep;
      
    case 'wait':
      if (typeof s.ms !== 'number' || s.ms < 0) {
        throw new Error(`Step ${index}: 'wait' action requires 'ms' (non-negative number)`);
      }
      return s as WaitStep;
      
    default:
      throw new Error(`Step ${index}: unknown action '${s.action}'`);
  }
}

/**
 * Execute a single step
 */
async function executeStep(step: Step, vars: Vars, options: Required<RunnerOptions>): Promise<void> {
  switch (step.action) {
    case 'log': {
      const message = interpolateTemplate(step.message, vars);
      console.info(message);
      break;
    }
    
    case 'set':
      vars[step.var] = step.value;
      break;
      
    case 'compute': {
      const result = evaluateExpression(step.expr, vars, options.maxStackSize);
      vars[step.var] = result;
      break;
    }
    
    case 'wait':
      await new Promise(resolve => setTimeout(resolve, step.ms));
      break;
  }
}

/**
 * Run IDA steps with the given variables and options
 * 
 * @param steps - Array of steps to execute
 * @param initialVars - Initial variables (optional)
 * @param options - Runner configuration (optional)
 * @returns Promise resolving to final variables state
 * 
 * @example
 * ```typescript
 * const steps = [
 *   { action: 'set', var: 'x', value: 10 },
 *   { action: 'set', var: 'y', value: 5 },
 *   { action: 'compute', var: 'sum', expr: 'x + y' },
 *   { action: 'log', message: 'Sum: ${sum}' }
 * ];
 * 
 * const finalVars = await runIDA(steps);
 * console.log(finalVars); // { x: 10, y: 5, sum: 15 }
 * ```
 */
export async function runIDA(
  steps: Step[],
  initialVars: Vars = {},
  options: RunnerOptions = {}
): Promise<Vars> {
  // Apply default options
  const opts: Required<RunnerOptions> = {
    maxSteps: options.maxSteps ?? 1000,
    maxStackSize: options.maxStackSize ?? 1000,
    timeoutMs: options.timeoutMs ?? 0,
  };
  
  // Check step count limit
  if (steps.length > opts.maxSteps) {
    throw new Error(`Too many steps: ${steps.length} (max: ${opts.maxSteps})`);
  }
  
  // Clone initial vars to avoid mutation
  const vars: Vars = { ...initialVars };
  
  // Define the execution function
  const execute = async () => {
    for (let i = 0; i < steps.length; i++) {
      // Validate step
      const step = validateStep(steps[i], i);
      
      // Execute step
      try {
        await executeStep(step, vars, opts);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Step ${i} (${step.action}): ${message}`);
      }
    }
    
    return vars;
  };
  
  // Execute with optional timeout
  if (opts.timeoutMs > 0) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Execution timeout after ${opts.timeoutMs}ms`)), opts.timeoutMs);
    });
    
    return await Promise.race([execute(), timeoutPromise]);
  } else {
    return await execute();
  }
}
