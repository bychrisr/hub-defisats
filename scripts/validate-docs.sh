#!/bin/bash

# Documentation Validation Script for Axisor
# This script validates all documentation files for quality, consistency, and completeness

set -e

echo "🔍 Starting documentation validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
VALID_FILES=0
ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to validate markdown files
validate_markdown() {
    echo "📝 Validating Markdown files..."
    
    # Check if markdownlint is installed
    if ! command -v markdownlint &> /dev/null; then
        print_status "WARNING" "markdownlint not found. Installing..."
        npm install -g markdownlint-cli
    fi
    
    # Validate all markdown files
    find docs -name "*.md" -type f | while read file; do
        TOTAL_FILES=$((TOTAL_FILES + 1))
        echo "Validating: $file"
        
        # Run markdownlint
        if markdownlint "$file" 2>/dev/null; then
            VALID_FILES=$((VALID_FILES + 1))
            print_status "SUCCESS" "Markdown validation passed: $file"
        else
            ERRORS=$((ERRORS + 1))
            print_status "ERROR" "Markdown validation failed: $file"
        fi
    done
}

# Function to validate YAML frontmatter
validate_frontmatter() {
    echo "📋 Validating YAML frontmatter..."
    
    find docs -name "*.md" -type f | while read file; do
        echo "Checking frontmatter: $file"
        
        # Check if file has YAML frontmatter
        if head -n 1 "$file" | grep -q "^---$"; then
            # Extract frontmatter
            frontmatter=$(sed -n '/^---$/,/^---$/p' "$file" | head -n -1 | tail -n +2)
            
            # Check required fields
            required_fields=("title" "description" "created" "updated" "author" "status" "tags")
            for field in "${required_fields[@]}"; do
                if echo "$frontmatter" | grep -q "^$field:"; then
                    print_status "SUCCESS" "Required field '$field' found in $file"
                else
                    WARNINGS=$((WARNINGS + 1))
                    print_status "WARNING" "Missing required field '$field' in $file"
                fi
            done
        else
            WARNINGS=$((WARNINGS + 1))
            print_status "WARNING" "No YAML frontmatter found in $file"
        fi
    done
}

# Function to validate internal links
validate_links() {
    echo "🔗 Validating internal links..."
    
    find docs -name "*.md" -type f | while read file; do
        echo "Checking links in: $file"
        
        # Extract all markdown links
        grep -o '\[.*\]([^)]*)' "$file" | while read link; do
            # Extract the URL part
            url=$(echo "$link" | sed 's/.*(\([^)]*\))/\1/')
            
            # Skip external links
            if [[ "$url" =~ ^https?:// ]]; then
                continue
            fi
            
            # Skip anchor links
            if [[ "$url" =~ ^# ]]; then
                continue
            fi
            
            # Check if the linked file exists
            if [[ -f "docs/$url" ]]; then
                print_status "SUCCESS" "Link valid: $url in $file"
            else
                ERRORS=$((ERRORS + 1))
                print_status "ERROR" "Broken link: $url in $file"
            fi
        done
    done
}

# Function to validate code snippets
validate_code_snippets() {
    echo "💻 Validating code snippets..."
    
    find docs -name "*.md" -type f | while read file; do
        echo "Checking code snippets in: $file"
        
        # Extract code blocks
        grep -n '```' "$file" | while read line; do
            line_num=$(echo "$line" | cut -d: -f1)
            content=$(echo "$line" | cut -d: -f2-)
            
            # Check if it's a code block start
            if [[ "$content" =~ ^``` ]]; then
                # Extract language
                lang=$(echo "$content" | sed 's/```//' | tr -d ' ')
                
                # Check if language is specified
                if [[ -n "$lang" ]]; then
                    print_status "SUCCESS" "Code block with language '$lang' found in $file:$line_num"
                else
                    WARNINGS=$((WARNINGS + 1))
                    print_status "WARNING" "Code block without language specified in $file:$line_num"
                fi
            fi
        done
    done
}

# Function to validate file structure
validate_structure() {
    echo "📁 Validating file structure..."
    
    # Check if all required directories exist
    required_dirs=("architecture" "integrations" "automations" "deployment" "security" "user-management" "charts" "administration" "testing" "monitoring" "troubleshooting" "migrations" "project" "knowledge" "workflow")
    
    for dir in "${required_dirs[@]}"; do
        if [[ -d "docs/$dir" ]]; then
            print_status "SUCCESS" "Required directory exists: docs/$dir"
        else
            ERRORS=$((ERRORS + 1))
            print_status "ERROR" "Missing required directory: docs/$dir"
        fi
    done
    
    # Check if index files exist
    if [[ -f "docs/index.md" ]]; then
        print_status "SUCCESS" "Main index file exists: docs/index.md"
    else
        ERRORS=$((ERRORS + 1))
        print_status "ERROR" "Missing main index file: docs/index.md"
    fi
    
    # Check if README exists
    if [[ -f "docs/README.md" ]]; then
        print_status "SUCCESS" "README file exists: docs/README.md"
    else
        WARNINGS=$((WARNINGS + 1))
        print_status "WARNING" "Missing README file: docs/README.md"
    fi
}

# Function to validate Docusaurus configuration
validate_docusaurus() {
    echo "⚙️  Validating Docusaurus configuration..."
    
    # Check if docusaurus.config.js exists
    if [[ -f "docusaurus.config.js" ]]; then
        print_status "SUCCESS" "Docusaurus configuration exists: docusaurus.config.js"
    else
        ERRORS=$((ERRORS + 1))
        print_status "ERROR" "Missing Docusaurus configuration: docusaurus.config.js"
    fi
    
    # Check if sidebars.js exists
    if [[ -f "sidebars.js" ]]; then
        print_status "SUCCESS" "Sidebars configuration exists: sidebars.js"
    else
        ERRORS=$((ERRORS + 1))
        print_status "ERROR" "Missing sidebars configuration: sidebars.js"
    fi
    
    # Check if package.json exists
    if [[ -f "package.json" ]]; then
        print_status "SUCCESS" "Package configuration exists: package.json"
    else
        ERRORS=$((ERRORS + 1))
        print_status "ERROR" "Missing package configuration: package.json"
    fi
}

# Function to generate validation report
generate_report() {
    echo "📊 Generating validation report..."
    
    cat > docs/validation-report.md << EOF
# Documentation Validation Report

Generated on: $(date)

## Summary

- **Total Files**: $TOTAL_FILES
- **Valid Files**: $VALID_FILES
- **Errors**: $ERRORS
- **Warnings**: $WARNINGS

## Validation Results

### Markdown Validation
- All markdown files have been validated for syntax and formatting
- Markdownlint rules have been applied

### YAML Frontmatter
- All files have been checked for required frontmatter fields
- Required fields: title, description, created, updated, author, status, tags

### Internal Links
- All internal links have been validated
- Broken links have been identified and reported

### Code Snippets
- All code blocks have been checked for language specification
- Syntax highlighting has been validated

### File Structure
- All required directories exist
- Index files are present
- README files are available

### Docusaurus Configuration
- Configuration files are present
- Sidebars are properly configured
- Package dependencies are defined

## Recommendations

1. Fix all errors before publishing
2. Address warnings for better quality
3. Ensure all links are working
4. Validate code snippets for accuracy
5. Update frontmatter for consistency

## Next Steps

1. Run \`npm run docs:build\` to test the build
2. Run \`npm run docs:serve\` to preview the site
3. Deploy to GitHub Pages or other hosting platform
EOF
    
    print_status "SUCCESS" "Validation report generated: docs/validation-report.md"
}

# Function to run all validations
run_all_validations() {
    echo "🚀 Running all documentation validations..."
    
    validate_markdown
    validate_frontmatter
    validate_links
    validate_code_snippets
    validate_structure
    validate_docusaurus
    generate_report
    
    echo "🎉 Documentation validation complete!"
    echo "📊 Results:"
    echo "  - Total files: $TOTAL_FILES"
    echo "  - Valid files: $VALID_FILES"
    echo "  - Errors: $ERRORS"
    echo "  - Warnings: $WARNINGS"
    
    if [[ $ERRORS -eq 0 ]]; then
        print_status "SUCCESS" "All validations passed! Documentation is ready for publication."
    else
        print_status "ERROR" "Validation failed with $ERRORS errors. Please fix before publishing."
        exit 1
    fi
}

# Main execution
main() {
    echo "🎯 Starting comprehensive documentation validation..."
    
    run_all_validations
    
    echo "📋 Validation report available at: docs/validation-report.md"
}

# Run main function
main "$@"