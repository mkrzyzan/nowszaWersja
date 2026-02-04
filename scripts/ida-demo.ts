/**
 * IDA Demo Script
 * 
 * Demonstrates usage of the IDA (Instant Declarative Actions) runner
 */

import { runIDA, type Step } from '../src/ida';

async function main() {
  console.log('🚀 IDA Demo - Instant Declarative Actions\n');
  
  // Example 1: Basic calculations
  console.log('Example 1: Rectangle calculations');
  console.log('─'.repeat(50));
  
  const rectangleSteps: Step[] = [
    { action: 'log', message: 'Calculating rectangle properties...' },
    { action: 'set', var: 'width', value: 15 },
    { action: 'set', var: 'height', value: 8 },
    { action: 'compute', var: 'area', expr: 'width * height' },
    { action: 'compute', var: 'perimeter', expr: '(width + height) * 2' },
    { action: 'log', message: 'Width: ${width}, Height: ${height}' },
    { action: 'log', message: 'Area: ${area}' },
    { action: 'log', message: 'Perimeter: ${perimeter}' }
  ];
  
  const result1 = await runIDA(rectangleSteps);
  console.log('\nFinal variables:', result1);
  
  // Example 2: Compound interest calculation
  console.log('\n\nExample 2: Compound interest calculation');
  console.log('─'.repeat(50));
  
  const interestSteps: Step[] = [
    { action: 'log', message: 'Calculating compound interest...' },
    { action: 'set', var: 'principal', value: 1000 },
    { action: 'set', var: 'rate', value: 0.05 },
    { action: 'set', var: 'time', value: 3 },
    { action: 'compute', var: 'multiplier', expr: '(1 + rate)' },
    { action: 'compute', var: 'amount', expr: 'principal * multiplier * multiplier * multiplier' },
    { action: 'compute', var: 'interest', expr: 'amount - principal' },
    { action: 'log', message: 'Principal: $${principal}' },
    { action: 'log', message: 'Rate: ${rate} (5%)' },
    { action: 'log', message: 'Time: ${time} years' },
    { action: 'log', message: 'Final amount: $${amount}' },
    { action: 'log', message: 'Interest earned: $${interest}' }
  ];
  
  const result2 = await runIDA(interestSteps);
  console.log('\nFinal variables:', result2);
  
  // Example 3: Step-by-step calculation with logging
  console.log('\n\nExample 3: Step-by-step calculation');
  console.log('─'.repeat(50));
  
  const stepByStepSteps: Step[] = [
    { action: 'set', var: 'x', value: 10 },
    { action: 'log', message: 'Starting with x = ${x}' },
    { action: 'compute', var: 'x', expr: 'x + 5' },
    { action: 'log', message: 'After adding 5: x = ${x}' },
    { action: 'compute', var: 'x', expr: 'x * 2' },
    { action: 'log', message: 'After multiplying by 2: x = ${x}' },
    { action: 'compute', var: 'x', expr: 'x - 7' },
    { action: 'log', message: 'After subtracting 7: x = ${x}' },
    { action: 'compute', var: 'x', expr: 'x / 4' },
    { action: 'log', message: 'After dividing by 4: x = ${x}' }
  ];
  
  const result3 = await runIDA(stepByStepSteps);
  console.log('\nFinal variables:', result3);
  
  // Example 4: Using initial variables
  console.log('\n\nExample 4: Temperature conversion (with initial vars)');
  console.log('─'.repeat(50));
  
  const tempSteps: Step[] = [
    { action: 'log', message: 'Converting ${celsius} Celsius to Fahrenheit...' },
    { action: 'compute', var: 'fahrenheit', expr: '(celsius * 9 / 5) + 32' },
    { action: 'log', message: '${celsius}°C = ${fahrenheit}°F' }
  ];
  
  const result4 = await runIDA(tempSteps, { celsius: 25 });
  console.log('\nFinal variables:', result4);
  
  // Example 5: Wait action
  console.log('\n\nExample 5: Countdown with delays');
  console.log('─'.repeat(50));
  
  const countdownSteps: Step[] = [
    { action: 'log', message: 'Starting countdown...' },
    { action: 'log', message: '3...' },
    { action: 'wait', ms: 500 },
    { action: 'log', message: '2...' },
    { action: 'wait', ms: 500 },
    { action: 'log', message: '1...' },
    { action: 'wait', ms: 500 },
    { action: 'log', message: '🎉 Go!' }
  ];
  
  await runIDA(countdownSteps);
  
  console.log('\n✅ All examples completed successfully!\n');
}

// Run the demo
main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
