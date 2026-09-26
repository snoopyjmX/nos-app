import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Transform StyleSheet.create
    if 'const getStyles = (themeTokens: any, isDark: boolean)' not in content:
        content = content.replace(
            'const styles = StyleSheet.create({',
            'const getStyles = (themeTokens: any, isDark: boolean) => StyleSheet.create({'
        )

    # 2. Inject `const styles = getStyles(...)`
    # Find `const themeTokens = getThemeTokens(isDark);`
    if 'const styles = getStyles(themeTokens, isDark);' not in content:
        content = re.sub(
            r'(const themeTokens = getThemeTokens\(isDark\);)',
            r'\1\n  const styles = getStyles(themeTokens, isDark);',
            content
        )

    # 3. Replace specific colors in the entire file
    replacements = {
        r"'#F8F9FD'": "themeTokens.background",
        r"'#F8F9FC'": "themeTokens.background",
        r"'#1E1B4B'": "themeTokens.textPrimary",
        r"'#16151E'": "themeTokens.textPrimary",
        r"'#686578'": "themeTokens.textSecondary",
        r"'#7E7699'": "themeTokens.textSecondary",
        r"'#8A879A'": "themeTokens.textSecondary",
        r"'#7C3AED'": "themeTokens.primary",
        r"'#8E7CE8'": "themeTokens.primary",
        r"'#735FD7'": "themeTokens.primary",
        r"'#5B4294'": "themeTokens.primaryDark",
        r"'#EFEDF6'": "themeTokens.glassBorder",
        r"'rgba\(255, 255, 255, 0.4\)'": "themeTokens.glassBorder",
    }

    # We only want to apply these inside the `getStyles` function or where it's safe.
    # To be safe, we just replace them globally but without quotes since they become variables.
    for old, new in replacements.items():
        content = re.sub(old, new, content, flags=re.IGNORECASE)

    # Note: `#FFFFFF` is skipped to preserve text on colored backgrounds.

    with open(filepath, 'w') as f:
        f.write(content)

process_file('app/(tabs)/dates.tsx')
process_file('app/(tabs)/memories.tsx')
process_file('app/(tabs)/profile.tsx')
