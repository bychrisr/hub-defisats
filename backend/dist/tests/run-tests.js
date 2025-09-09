#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const testFiles = ['security.test.ts', 'idor.test.ts', 'performance.test.ts'];
const testDir = __dirname;
console.log('🧪 Running Security and Performance Tests...\n');
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
for (const testFile of testFiles) {
    const testPath = (0, path_1.join)(testDir, testFile);
    if (!(0, fs_1.existsSync)(testPath)) {
        console.log(`❌ Test file not found: ${testFile}`);
        continue;
    }
    console.log(`\n📋 Running ${testFile}...`);
    console.log('─'.repeat(50));
    try {
        const startTime = Date.now();
        const result = (0, child_process_1.execSync)(`tsx ${testPath}`, {
            cwd: process.cwd(),
            encoding: 'utf8',
            stdio: 'pipe',
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`✅ ${testFile} completed successfully in ${duration}ms`);
        console.log(result);
        passedTests++;
    }
    catch (error) {
        console.log(`❌ ${testFile} failed`);
        console.log(error.stdout || error.message);
        failedTests++;
    }
    totalTests++;
}
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
if (failedTests > 0) {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
}
else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
}
//# sourceMappingURL=run-tests.js.map