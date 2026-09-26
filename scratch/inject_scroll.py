import re

files = [
    '/Users/joao/nos-app/app/(tabs)/index.tsx',
    '/Users/joao/nos-app/app/(tabs)/dates.tsx',
    '/Users/joao/nos-app/app/(tabs)/profile.tsx',
]

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    if 'useScrollNavbar' not in content:
        # Import the hook
        content = re.sub(
            r"(import \{ getThemeTokens \} from '../../constants/theme';)",
            r"\1\nimport { useScrollNavbar } from '../../hooks/useScrollNavbar';",
            content
        )
        
        # Instantiate the hook
        content = re.sub(
            r"(const insets = useSafeAreaInsets\(\);)",
            r"\1\n  const { onScroll } = useScrollNavbar();",
            content
        )
        
        # Add onScroll to ScrollView
        content = re.sub(
            r"(<ScrollView\s+showsVerticalScrollIndicator=\{false\}\s+contentContainerStyle=\{styles\.scrollContent\})",
            r"\1\n        onScroll={onScroll}\n        scrollEventThrottle={16}",
            content
        )
        # Profile has a different ScrollView
        content = re.sub(
            r"(<ScrollView\s+showsVerticalScrollIndicator=\{false\}\s+contentContainerStyle=\{styles\.container\})",
            r"\1\n        onScroll={onScroll}\n        scrollEventThrottle={16}",
            content
        )
        
        with open(f, 'w') as file:
            file.write(content)
        print(f"Updated {f}")
    else:
        print(f"Already updated {f}")
