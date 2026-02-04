#!/usr/bin/env bun
/**
 * IDA Demo Script
 * 
 * Demonstrates the IDA (Instant Declarative Actions) runner
 * with a practical example workflow.
 */

import { runIDA, type Step } from '../src/ida';

async function main() {
  console.log('🚀 IDA Demo - Instant Declarative Actions\n');
  
  // Example 1: Simple calculation workflow
  console.log('📊 Example 1: E-commerce Order Calculation');
  console.log('==========================================\n');
  
  const orderSteps: Step[] = [
    { action: 'set', var: 'itemPrice', value: 29.99 },
    { action: 'set', var: 'quantity', value: 3 },
    { action: 'log', message: '• Item price: $${itemPrice}' },
    { action: 'log', message: '• Quantity: ${quantity}' },
    
    { action: 'compute', var: 'subtotal', expr: 'itemPrice * quantity' },
    { action: 'log', message: '• Subtotal: $${subtotal}' },
    
    { action: 'set', var: 'taxRate', value: 0.0825 },
    { action: 'compute', var: 'tax', expr: 'subtotal * taxRate' },
    { action: 'log', message: '• Tax (8.25%): $${tax}' },
    
    { action: 'set', var: 'shipping', value: 5.99 },
    { action: 'log', message: '• Shipping: $${shipping}' },
    
    { action: 'compute', var: 'total', expr: 'subtotal + tax + shipping' },
    { action: 'log', message: '\n✅ Order Total: $${total}' },
  ];
  
  const orderResult = await runIDA(orderSteps);
  console.log('\nFinal variables:', orderResult);
  
  // Example 2: Expression evaluation with parentheses
  console.log('\n\n🧮 Example 2: Math Expression Evaluation');
  console.log('==========================================\n');
  
  const mathSteps: Step[] = [
    { action: 'set', var: 'a', value: 10 },
    { action: 'set', var: 'b', value: 5 },
    { action: 'set', var: 'c', value: 3 },
    { action: 'log', message: 'Variables: a=${a}, b=${b}, c=${c}' },
    
    { action: 'compute', var: 'simple', expr: 'a + b' },
    { action: 'log', message: '• a + b = ${simple}' },
    
    { action: 'compute', var: 'precedence', expr: 'a + b * c' },
    { action: 'log', message: '• a + b * c = ${precedence} (precedence: 10 + 15 = 25)' },
    
    { action: 'compute', var: 'parens', expr: '(a + b) * c' },
    { action: 'log', message: '• (a + b) * c = ${parens} (with parens: 15 * 3 = 45)' },
    
    { action: 'compute', var: 'complex', expr: '((a * b) + c) / (b - c)' },
    { action: 'log', message: '• ((a * b) + c) / (b - c) = ${complex}' },
  ];
  
  const mathResult = await runIDA(mathSteps);
  console.log('\nFinal variables:', mathResult);
  
  // Example 3: Async operations with wait
  console.log('\n\n⏱️  Example 3: Async Workflow with Delays');
  console.log('==========================================\n');
  
  const asyncSteps: Step[] = [
    { action: 'set', var: 'step', value: 1 },
    { action: 'log', message: '[Step ${step}] Starting process...' },
    
    { action: 'wait', ms: 500 },
    { action: 'set', var: 'step', value: 2 },
    { action: 'log', message: '[Step ${step}] Processing data...' },
    
    { action: 'wait', ms: 500 },
    { action: 'set', var: 'step', value: 3 },
    { action: 'log', message: '[Step ${step}] Finalizing...' },
    
    { action: 'wait', ms: 500 },
    { action: 'log', message: '\n✅ Process completed!' },
  ];
  
  const start = Date.now();
  await runIDA(asyncSteps);
  const elapsed = Date.now() - start;
  console.log(`\nTotal execution time: ${elapsed}ms (expected ~1500ms)\n`);
  
  // Example 4: Using initial variables
  console.log('\n📥 Example 4: Using Initial Variables');
  console.log('==========================================\n');
  
  const configSteps: Step[] = [
    { action: 'log', message: 'Configuration:' },
    { action: 'log', message: '• Environment: ${env}' },
    { action: 'log', message: '• Debug mode: ${debug}' },
    { action: 'log', message: '• Port: ${port}' },
    
    { action: 'compute', var: 'maxConnections', expr: 'port * 10' },
    { action: 'log', message: '• Max connections: ${maxConnections}' },
  ];
  
  const initialConfig = {
    env: 'production',
    debug: false,
    port: 3000,
  };
  
  const configResult = await runIDA(configSteps, initialConfig);
  console.log('\nFinal configuration:', configResult);
  
  console.log('\n✨ Demo completed successfully!\n');
}

// Run the demo
main().catch(error => {
  console.error('\n❌ Demo failed:', error.message);
  process.exit(1);
});
