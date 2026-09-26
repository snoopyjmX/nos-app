import re
import os

def clean_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    out_lines = []
    in_styles = False
    for line in lines:
        if 'const getStyles =' in line:
            in_styles = True
            
        if in_styles:
            # If it's a hardcoded white rgba background/border
            if re.search(r'(backgroundColor|borderColor):\s*\'rgba\(255,\s*255,\s*255,\s*[0-9.]+\)\'', line):
                continue
            
            # If it's shadow properties inside styles (we rely on LiquidGlassView)
            # Actually, we shouldn't strip ALL shadows, some icons or texts might have them.
            # But let's strip them if they are the primary or primaryDark, since that was the card shadow.
            if re.search(r'shadowColor:\s*themeTokens\.primaryDark', line) or re.search(r'shadowColor:\s*themeTokens\.primary', line):
                # Also strip the subsequent shadow properties if we want, but it's simpler to just let them be without color
                # actually let's skip the line
                continue
                
        out_lines.append(line)

    with open(filepath, 'w') as f:
        f.writelines(out_lines)

clean_file('app/(tabs)/dates.tsx')
clean_file('app/(tabs)/memories.tsx')
clean_file('app/(tabs)/profile.tsx')
