import re

with open("app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove background blobs
content = re.sub(
    r'<div className="absolute top-0 left-1/4.*?mix-blend-screen" />\n\s*<div className="absolute bottom-0 right-1/4.*?mix-blend-screen" style={{ animationDelay: "2s" }} />',
    '',
    content,
    flags=re.DOTALL
)

# 2. Fix hero title text
content = content.replace(
    'className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 text-transparent bg-clip-text"',
    'className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl text-content"'
)

# 3. Simplify the dashboard mockup glow to avoid weird artifacts
content = content.replace(
    'className="w-full mt-20 relative p-2 rounded-[32px] bg-surface-tint shadow-2xl shadow-accent-primary/10 border border-light/50 glass hover:scale-[1.01] transition-transform duration-700"',
    'className="w-full mt-20 relative p-2 rounded-[32px] bg-surface-tint shadow-[var(--shadow-soft)] border border-light glass"'
)

with open("app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

