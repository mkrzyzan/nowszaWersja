# IDA - Instant Declarative Actions

IDA is a small, safe, TypeScript declarative steps runner for executing sequences of simple actions defined as JSON arrays. It provides a minimal scripting capability without the need for eval or unsafe code execution.

## Features

- **Type-safe**: Full TypeScript support with strict typing
- **Safe execution**: No `eval()` or `Function()` constructor usage
- **Declarative**: Define steps as simple JSON objects
- **Configurable limits**: Prevent runaway scripts with configurable timeouts and step limits
- **Zero dependencies**: Pure TypeScript implementation

## Installation

IDA is included in the grosik package:

```typescript
import { runIDA, type Step, type Vars } from 'grosik/ida';
```

## Basic Usage

```typescript
import { runIDA } from './src/ida';

const steps = [
  { action: 'set', var: 'x', value: 10 },
  { action: 'compute', var: 'y', expr: 'x * 2' },
  { action: 'log', message: 'Result: ${y}' }
];

const finalVars = await runIDA(steps);
console.log(finalVars); // { x: 10, y: 20 }
```

## Supported Actions

### `set` - Set a variable

Sets a variable to a specific value (number, string, or boolean).

```typescript
{ action: 'set', var: 'name', value: 'Alice' }
{ action: 'set', var: 'age', value: 30 }
{ action: 'set', var: 'active', value: true }
```

### `compute` - Calculate numeric expressions

Computes a mathematical expression and stores the result in a variable. Supports:
- Basic operators: `+`, `-`, `*`, `/`
- Parentheses for grouping: `(`, `)`
- Variable references
- Numbers (integers and floats)

```typescript
{ action: 'compute', var: 'area', expr: 'width * height' }
{ action: 'compute', var: 'result', expr: '(a + b) * 2' }
{ action: 'compute', var: 'avg', expr: '(x + y + z) / 3' }
```

**Safety Notes:**
- No `eval()` is used; expressions are parsed with a safe tokenizer and evaluated using the Shunting Yard algorithm
- Only numeric variables are allowed in expressions
- Division by zero is caught and reported as an error

### `log` - Log messages

Logs a message to the console with variable interpolation.

```typescript
{ action: 'log', message: 'Hello World' }
{ action: 'log', message: 'The value of x is ${x}' }
{ action: 'log', message: 'Area: ${area}, Perimeter: ${perimeter}' }
```

Variables are interpolated using `${varName}` syntax. If a variable doesn't exist, the placeholder is left as-is.

### `wait` - Async delay

Pauses execution for a specified number of milliseconds.

```typescript
{ action: 'wait', ms: 1000 }  // Wait 1 second
{ action: 'wait', ms: 500 }   // Wait 500ms
```

## Configuration Options

The `runIDA` function accepts optional configuration:

```typescript
interface RunnerOptions {
  maxSteps?: number;      // Default: 1000
  maxStackSize?: number;  // Default: 1000
  timeoutMs?: number;     // Default: 0 (no timeout)
}
```

### Example with options:

```typescript
const steps = [
  { action: 'set', var: 'x', value: 10 },
  { action: 'wait', ms: 5000 }
];

// This will timeout after 1 second
await runIDA(steps, {}, { timeoutMs: 1000 });
```

## Initial Variables

You can provide initial variables when starting execution:

```typescript
const steps = [
  { action: 'compute', var: 'total', expr: 'price * quantity' },
  { action: 'log', message: 'Total: $${total}' }
];

const initialVars = { price: 29.99, quantity: 3 };
await runIDA(steps, initialVars);
```

## Complete Example

```typescript
import { runIDA, type Step } from './src/ida';

async function calculateRectangle() {
  const steps: Step[] = [
    { action: 'log', message: 'Calculating rectangle properties...' },
    { action: 'set', var: 'width', value: 15 },
    { action: 'set', var: 'height', value: 8 },
    { action: 'compute', var: 'area', expr: 'width * height' },
    { action: 'compute', var: 'perimeter', expr: '(width + height) * 2' },
    { action: 'log', message: 'Width: ${width}, Height: ${height}' },
    { action: 'log', message: 'Area: ${area}' },
    { action: 'log', message: 'Perimeter: ${perimeter}' }
  ];
  
  const result = await runIDA(steps);
  return result;
}

calculateRectangle().then(vars => {
  console.log('Final state:', vars);
});
```

## Error Handling

IDA provides detailed error messages with step indices:

```typescript
try {
  await runIDA(steps);
} catch (error) {
  console.error(error.message);
  // Example: "Step 2 (compute): Unknown variable: unknown"
}
```

Common errors:
- Unknown variables in expressions
- Division by zero
- Invalid step structure
- Exceeded step limits
- Timeout exceeded
- Mismatched parentheses in expressions

## Security Considerations

IDA is designed with security in mind:

1. **No eval**: Expression parsing uses a safe tokenizer and Shunting Yard algorithm
2. **Limited operations**: Only basic math operations are supported
3. **No code execution**: Steps are declarative data structures, not executable code
4. **Configurable limits**: Prevent runaway scripts with `maxSteps` and `timeoutMs`
5. **Stack protection**: Expression evaluation uses bounded stack depth

## Limitations

- Expressions support only basic math operations (`+`, `-`, `*`, `/`)
- No boolean operations or conditionals
- No loops or control flow (steps execute sequentially)
- No function calls (except built-in actions)
- String operations are limited to template interpolation in log messages

These limitations are intentional to keep IDA simple, safe, and predictable.

## Running the Demo

See the demo script for more examples:

```bash
bun run scripts/ida-demo.ts
```

## Future Extensions

Potential future enhancements (not yet implemented):
- Boolean expressions and conditional steps
- Loop constructs with safety limits
- Math functions (sqrt, pow, sin, cos, etc.)
- String manipulation functions
- Array/object operations

## License

MIT
