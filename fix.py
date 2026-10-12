import re
with open('app/dashboard/actions.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("select('*'}).eq", "select('*').eq")

lines = text.split('\n')
for i, line in enumerate(lines):
    if line.strip() == ')':
        prev = lines[i-1]
        if 'name: ' in prev or 'return { ' in prev or 'updated_at: ' in prev or 'accent: ' in prev or '...rest' in prev:
            lines[i] = line.replace(')', '})')
            
text = '\n'.join(lines)
with open('app/dashboard/actions.ts', 'w', encoding='utf-8') as f:
    f.write(text)

