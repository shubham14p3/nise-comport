import assert from 'node:assert/strict';
import { test } from 'node:test';
import { counterAmounts, counterPolicy, DEFAULT_COUNTER_POLICY } from '../src/lib/counter-rules.ts';
test('default deduction, empty-wallet earning, and optional accumulation never stack', () => {
 assert.deepEqual(counterAmounts(10000, 5000, 'deduct', DEFAULT_COUNTER_POLICY), {discountPaise:1000,earnedPaise:0,collectPaise:9000,balanceAfterPaise:4000});
 assert.deepEqual(counterAmounts(10000, 0, 'deduct', DEFAULT_COUNTER_POLICY), {discountPaise:0,earnedPaise:500,collectPaise:10000,balanceAfterPaise:500});
 assert.deepEqual(counterAmounts(10000, 5000, 'accumulate', DEFAULT_COUNTER_POLICY), {discountPaise:0,earnedPaise:500,collectPaise:10000,balanceAfterPaise:5500});
 assert.equal(counterAmounts(10000, 200, 'deduct', DEFAULT_COUNTER_POLICY).discountPaise, 200);
 assert.equal(counterAmounts(101, 0, 'deduct', DEFAULT_COUNTER_POLICY).earnedPaise, 5);
 assert.equal(counterAmounts(10000,0,'accumulate',{deductionPercent:12,accumulationPercent:7}).earnedPaise,700);
 assert.equal(counterAmounts(10000,0,'accumulate',{deductionPercent:0,accumulationPercent:0}).earnedPaise,0);
 assert.throws(()=>counterAmounts(NaN,0,'deduct',DEFAULT_COUNTER_POLICY));
});
test('saved rates have bounded finite defaults',()=>{
 assert.deepEqual(counterPolicy({deductionPercent:Infinity,accumulationPercent:-1}),DEFAULT_COUNTER_POLICY);
 assert.deepEqual(counterPolicy({deductionPercent:0,accumulationPercent:100}),{deductionPercent:0,accumulationPercent:100});
});
