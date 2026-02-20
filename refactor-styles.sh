#!/bin/bash

# This script helps identify inline styles that need to be converted to CSS classes
# Run with: bash refactor-styles.sh

echo "Finding all files with inline styles..."
echo "======================================"

# Count total inline styles
total=$(grep -r "style={{" src/**/*.tsx | wc -l)
echo "Total inline styles found: $total"
echo ""

# Show breakdown by file
echo "Breakdown by file:"
echo "------------------"
grep -r "style={{" src/**/*.tsx | cut -d: -f1 | sort | uniq -c | sort -rn

echo ""
echo "Most common patterns to convert:"
echo "--------------------------------"

# Common patterns
echo "1. Loading containers"
grep -r "display: 'flex'.*center.*height: '100vh'" src/**/*.tsx | wc -l

echo "2. Text styling"
grep -r "fontSize.*fontWeight.*color.*margin" src/**/*.tsx | wc -l

echo "3. Flex layouts"
grep -r "display: 'flex'.*gap" src/**/*.tsx | wc -l
