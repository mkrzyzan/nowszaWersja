# IDA - Instant Declarative Actions

A small, safe TypeScript declarative steps runner for executing JSON-defined scripts.

## Overview

IDA (Instant Declarative Actions) is a lightweight, secure runner that executes steps defined as JSON arrays. It's designed for safe script execution without using `eval` or dynamic code generation.

## Features

- **Safe Execution**: No use of `eval` or `Function` constructor
- **Type-Safe**: Full TypeScript support with exported types
- **Configurable Limits**: Protection against runaway scripts
- **Rich Step Types**: Support for variables, math expressions, logging, and async delays
- **Expression Parser**: Safe mathematical expression evaluation using shunting-yard algorithm

## Installation

IDA is part of the grosik package. Import it directly:

```typescript
import { runIDA, type Step, type Vars } from 'grosik';
```

## Usage

### Basic Example

```typescript
import { runIDA } from 'grosik';

const steps = [
  { action: 'set', var: 'x', value: 10 },
  { action: 'set', var: 'y', value: 5 },
  { action: 'compute', var: 'sum', expr: 'x + y' },
  { action: 'log', message: 'Sum: ${sum}' }
];

const result = await runIDA(steps);
console.log(result); // { x: 10, y: 5, sum: 15 }
```

## Supported Step Types

### `set` - Set Variable

Assigns a value to a variable.

```typescript
{ 
  action: 'set',
  var: 'variableName',
  value: 42 | "string" | true
}
```

**Fields:**
- `var` (string): Variable name
- `value` (number | string | boolean): Value to assign

**Example:**
```typescript
{ action: 'set', var: 'count', value: 100 }
{ action: 'set', var: 'name', value: 'Alice' }
{ action: 'set', var: 'enabled', value: true }
```

### `log` - Log Message

Outputs a message with variable interpolation using `${varName}` syntax.

```typescript
{
  action: 'log',
  message: 'Template string with ${variables}'
}
```

**Fields:**
- `message` (string): Message template with `${varName}` placeholders

**Example:**
```typescript
{ action: 'log', message: 'Hello ${name}, count is ${count}' }
```

### `compute` - Evaluate Expression

Evaluates a mathematical expression and stores the result.

```typescript
{
  action: 'compute',
  var: 'resultVar',
  expr: 'mathematical expression'
}
```

**Fields:**
- `var` (string): Variable to store the result
- `expr` (string): Mathematical expression

**Supported in expressions:**
- Numbers: `42`, `3.14159`
- Variables: `x`, `myVar`
- Operators: `+`, `-`, `*`, `/`
- Parentheses: `(`, `)`

**Examples:**
```typescript
{ action: 'compute', var: 'sum', expr: 'a + b' }
{ action: 'compute', var: 'result', expr: '(x + y) * 2' }
{ action: 'compute', var: 'complex', expr: '((a * b) + c) / (d - e)' }
```

### `wait` - Async Delay

Pauses execution for the specified duration.

```typescript
{
  action: 'wait',
  ms: 1000
}
```

**Fields:**
- `ms` (number): Delay in milliseconds (must be non-negative)

**Example:**
```typescript
{ action: 'wait', ms: 500 }
```

## API

### `runIDA(steps, initialVars?, options?)`

Executes a sequence of steps and returns the final variable state.

**Parameters:**
- `steps` (Step[]): Array of steps to execute
- `initialVars` (Vars, optional): Initial variable values
- `options` (RunnerOptions, optional): Configuration options

**Returns:** `Promise<Vars>` - Final state of all variables

**Example:**
```typescript
const initialVars = { x: 10 };
const options = { maxSteps: 100, timeoutMs: 5000 };
const result = await runIDA(steps, initialVars, options);
```

### Types

#### `Vars`
```typescript
type Vars = Record<string, number | string | boolean>;
```

#### `Step`
```typescript
type Step = LogStep | SetStep | ComputeStep | WaitStep;
```

#### `RunnerOptions`
```typescript
interface RunnerOptions {
  maxSteps?: number;        // Default: 1000
  maxStackSize?: number;    // Default: 1000
  timeoutMs?: number;       // Default: 0 (no timeout)
}
```

## Safety & Security

### No Dynamic Code Execution

IDA does not use `eval()` or the `Function` constructor. All expressions are parsed using a safe tokenizer, shunting-yard algorithm, and RPN evaluator.

### Configurable Limits

Protect against runaway scripts with configurable limits:

```typescript
const options = {
  maxSteps: 1000,      // Maximum number of steps
  maxStackSize: 1000,  // Maximum expression evaluation stack size
  timeoutMs: 5000      // Abort after 5 seconds
};

await runIDA(steps, {}, options);
```

### Input Validation

All steps are validated before execution. Invalid steps throw descriptive errors with step index:

```typescript
// Error: Step 3 (compute): Unknown variable in expression: undefinedVar
```

### Scoped Variables

Variables are scoped to the execution context and don't leak to global scope.

## Expression Evaluation

IDA uses a multi-stage safe expression evaluator:

1. **Tokenization**: Parse expression into tokens, replacing variables with values
2. **Shunting-Yard**: Convert infix notation to Reverse Polish Notation (RPN)
3. **RPN Evaluation**: Calculate result using stack-based evaluation

This approach ensures:
- No string-based code execution
- Proper operator precedence (`*`, `/` before `+`, `-`)
- Correct parentheses handling
- Stack overflow protection

## Error Handling

IDA provides clear error messages with context:

```typescript
// Unknown variable
// Error: Step 2 (log): Unknown variable: missing

// Type error
// Error: Step 3 (compute): Variable name is not a number (got string)

// Division by zero
// Error: Step 4 (compute): Division by zero

// Timeout
// Error: Execution timeout after 5000ms
```

## Complete Example

```typescript
import { runIDA, type Step } from 'grosik';

async function calculateOrder() {
  const steps: Step[] = [
    // Set initial values
    { action: 'set', var: 'price', value: 29.99 },
    { action: 'set', var: 'quantity', value: 3 },
    
    // Calculate subtotal
    { action: 'compute', var: 'subtotal', expr: 'price * quantity' },
    
    // Apply tax
    { action: 'set', var: 'taxRate', value: 0.08 },
    { action: 'compute', var: 'tax', expr: 'subtotal * taxRate' },
    
    // Add shipping
    { action: 'set', var: 'shipping', value: 5.99 },
    
    // Calculate total
    { action: 'compute', var: 'total', expr: 'subtotal + tax + shipping' },
    
    // Log result
    { action: 'log', message: 'Order Total: $${total}' }
  ];
  
  const result = await runIDA(steps);
  return result.total;
}

const total = await calculateOrder();
console.log(`Total: $${total}`);
```

## Running the Demo

A demonstration script is included:

```bash
bun run scripts/ida-demo.ts
```

This shows examples of:
- E-commerce calculations
- Expression evaluation with operator precedence
- Async workflows with delays
- Using initial variables

## Limitations

- **Expression Support**: Only numeric expressions with `+`, `-`, `*`, `/`, and parentheses
- **No String Operations**: String concatenation or manipulation not supported in `compute`
- **No Conditionals**: No if/else or loop constructs (by design for safety)
- **No External Calls**: Cannot execute external commands or make network requests

## License

MIT
