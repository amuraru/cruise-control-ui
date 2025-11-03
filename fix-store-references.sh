#!/bin/bash

# Script to fix all remaining Vuex store references to Pinia

echo "Fixing store references in Vue components..."

# Find all Vue files that contain store references
files=$(grep -r -l "\$store" src/components/ --include="*.vue")

for file in $files; do
    echo "Processing: $file"
    
    # Add store import if not already present
    if ! grep -q "import { useAppStore }" "$file"; then
        # Find the script tag and add import after existing imports
        sed -i '' '/^<script>/,/^export default/ {
            /^import.*from/ {
                :a
                n
                /^import.*from/ba
                /^$/i\
import { useAppStore } from '\''@/store'\''
            }
        }' "$file"
        
        # Add setup method if not present
        sed -i '' '/export default {/,/}/ {
            /props:.*{/,/},/ {
                /},/a\
  setup() {\
    const store = useAppStore()\
    return { store }\
  },
            }
        }' "$file"
    fi
    
    # Replace store references
    sed -i '' 's/this\.\$store\.state\./this.store./g' "$file"
    sed -i '' 's/this\.\$store\.getters\./this.store./g' "$file"
    sed -i '' 's/this\.\$store\.commit('\''seturl'\''/this.store.seturl(/g' "$file"
    sed -i '' 's/this\.\$store\.commit('\''setonline'\''/this.store.setonline(/g' "$file"
    sed -i '' 's/this\.\$store\.commit('\''config'\''/this.store.setConfig(/g' "$file"
    sed -i '' 's/this\.\$store\.commit('\''configError'\''/this.store.setConfigError(/g' "$file"
    sed -i '' 's/this\.\$store\.commit('\''configErrorMessage'\''/this.store.setConfigErrorMessage(/g' "$file"
    sed -i '' 's/this\.\$store\.commit('\''setTaskId'\''/this.store.setTaskId(/g' "$file"
    
    # Fix template references
    sed -i '' 's/\$store\.state\./store./g' "$file"
    sed -i '' 's/\$store\.getters\./store./g' "$file"
done

echo "Store references fixed!"
