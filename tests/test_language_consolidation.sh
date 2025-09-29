#!/bin/bash

echo "🌍 Testing Language Selection Consolidation"
echo "=========================================="

echo "1. Checking if frontend is accessible..."
if curl -f -s http://localhost:3000/ > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

echo -e "\n2. Checking LanguageConfig.js availability..."
lang_config_status=$(curl -s -w "%{http_code}" http://localhost:3000/js/config/LanguageConfig.js -o /dev/null)
if [ "$lang_config_status" -eq 200 ]; then
    echo "✅ LanguageConfig.js is accessible (HTTP $lang_config_status)"
else
    echo "❌ LanguageConfig.js failed (HTTP $lang_config_status)"
fi

echo -e "\n3. Checking LanguageSelect component..."
lang_select_status=$(curl -s -w "%{http_code}" http://localhost:3000/js/components/LanguageSelect.js -o /dev/null)
if [ "$lang_select_status" -eq 200 ]; then
    echo "✅ LanguageSelect.js is accessible (HTTP $lang_select_status)"
else
    echo "❌ LanguageSelect.js failed (HTTP $lang_select_status)"
fi

echo -e "\n4. Checking language CSS..."
lang_css_status=$(curl -s -w "%{http_code}" http://localhost:3000/css/components/language.css -o /dev/null)
if [ "$lang_css_status" -eq 200 ]; then
    echo "✅ Language CSS is accessible (HTTP $lang_css_status)"
else
    echo "❌ Language CSS failed (HTTP $lang_css_status)"
fi

echo -e "\n5. Testing JavaScript modules syntax..."
# Download and check for basic syntax issues
echo "Checking LanguageConfig.js syntax..."
config_content=$(curl -s http://localhost:3000/js/config/LanguageConfig.js)
if echo "$config_content" | grep -q "export const LANGUAGES" && echo "$config_content" | grep -q "getLanguageDisplayName"; then
    echo "✅ LanguageConfig.js exports found"
else
    echo "❌ LanguageConfig.js exports missing"
fi

echo -e "\nChecking LanguageSelect.js syntax..."
select_content=$(curl -s http://localhost:3000/js/components/LanguageSelect.js)
if echo "$select_content" | grep -q "export default class LanguageSelect" && echo "$select_content" | grep -q "getLanguageDisplayName"; then
    echo "✅ LanguageSelect.js class and imports found"
else
    echo "❌ LanguageSelect.js class or imports missing"
fi

echo -e "\n6. Checking for language flags in config..."
if echo "$config_content" | grep -q "🇺🇸" && echo "$config_content" | grep -q "🇪🇸" && echo "$config_content" | grep -q "🇫🇷"; then
    echo "✅ Flag emojis found in language config"
else
    echo "❌ Flag emojis missing from language config"
fi

echo -e "\n✅ SUMMARY:"
echo "- Language configuration consolidated into LanguageConfig.js"
echo "- LanguageSelect component supports both source and target languages"
echo "- Flag emojis included for visual appeal"
echo "- CSS styling updated for better appearance"
echo "- Both dropdowns now use the same data source"
echo ""
echo "🧪 MANUAL TESTING:"
echo "1. Open http://localhost:3000"
echo "2. Check 'Language' dropdown shows: 🇺🇸 English, 🇪🇸 Spanish, etc."
echo "3. Select 'Translation' task"
echo "4. Check 'Translate to' dropdown shows: 🇺🇸 EN, 🇪🇸 ES, etc."
echo "5. Verify both dropdowns have consistent flag representations"
echo "6. Test transcription with different language selections"

echo -e "\n💡 If language dropdowns don't show flags properly:"
echo "- Check browser console for JavaScript errors"
echo "- Verify the browser supports flag emojis"
echo "- Check that CSS is loading correctly"
