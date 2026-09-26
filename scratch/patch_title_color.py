import re

def update_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Replace the color for the brandTitle
    content = re.sub(
        r'<Text style=\{\[styles\.brandTitle, \{ color: themeTokens\.textPrimary \}\]\}>nós\.</Text>',
        r'<Text style={[styles.brandTitle, { color: themeTokens.primary }]}>nós.</Text>',
        content
    )

    with open(path, 'w') as f:
        f.write(content)

update_file('app/(auth)/login.tsx')
update_file('app/(auth)/register.tsx')
