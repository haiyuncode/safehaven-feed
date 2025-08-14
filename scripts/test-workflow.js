#!/usr/bin/env node

/**
 * Test script to verify that the workflow will work correctly
 * Run this locally before pushing workflow changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing workflow functionality...\n');

// Test 1: Check if feed generation works
console.log('1️⃣ Testing feed generation...');
try {
  execSync('npm run build:feeds', { stdio: 'inherit' });
  console.log('✅ Feed generation successful\n');
} catch (error) {
  console.error('❌ Feed generation failed:', error.message);
  process.exit(1);
}

// Test 2: Check if feeds were actually created
console.log('2️⃣ Verifying feed files exist...');
const feedsDir = path.join(__dirname, '..', 'public', 'feeds');
const expectedFeeds = ['positivity.json', 'narcissism.json', 'fitness.json'];

let allFeedsExist = true;
for (const feedFile of expectedFeeds) {
  const feedPath = path.join(feedsDir, feedFile);
  if (fs.existsSync(feedPath)) {
    console.log(`✅ ${feedFile} exists`);
    
    // Check if it's valid JSON
    try {
      const content = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
      if (content.generatedAt && content.topic) {
        console.log(`   📅 Generated: ${content.generatedAt}`);
        console.log(`   📂 Topic: ${content.topic}`);
        console.log(`   🎥 Videos: ${content.videos?.length || 0}`);
      }
    } catch (err) {
      console.error(`❌ ${feedFile} contains invalid JSON:`, err.message);
      allFeedsExist = false;
    }
  } else {
    console.error(`❌ ${feedFile} does not exist`);
    allFeedsExist = false;
  }
}

if (!allFeedsExist) {
  process.exit(1);
}

console.log('✅ All feed files verified\n');

// Test 3: Check git status to see if there are changes
console.log('3️⃣ Checking git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('✅ Git shows changes (workflow will have content to commit)');
    console.log('Changed files:');
    gitStatus.split('\n').forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
  } else {
    console.log('ℹ️ No git changes detected (workflow may skip if no changes)');
  }
} catch (error) {
  console.error('❌ Git status check failed:', error.message);
}

console.log('\n4️⃣ Checking workflow files...');

// Test 4: Check if workflow files exist
const workflowFiles = [
  '.github/workflows/build-feeds.yml',
  '.github/workflows/feeds-pr.yml'
];

for (const workflowFile of workflowFiles) {
  const workflowPath = path.join(__dirname, '..', workflowFile);
  if (fs.existsSync(workflowPath)) {
    console.log(`✅ ${workflowFile} exists`);
  } else {
    console.error(`❌ ${workflowFile} missing`);
    process.exit(1);
  }
}

console.log('\n5️⃣ Checking package.json scripts...');

// Test 5: Check if required npm scripts exist
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = ['build:feeds'];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ npm script "${script}" exists`);
    } else {
      console.error(`❌ npm script "${script}" missing`);
      process.exit(1);
    }
  }
} else {
  console.error('❌ package.json not found');
  process.exit(1);
}

console.log('\n🎉 All tests passed! Workflow should function correctly.');
console.log('\n📋 Next steps:');
console.log('   1. Commit and push these workflow changes');
console.log('   2. Go to Actions tab in GitHub');
console.log('   3. Manually trigger "Build topic feeds" workflow to test');
console.log('   4. If it fails, check the troubleshooting guide in .github/WORKFLOW_TROUBLESHOOTING.md');
