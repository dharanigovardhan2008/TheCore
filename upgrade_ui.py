import re
import os

# 1. Update Home Page (app/page.tsx)
with open("app/page.tsx", "r", encoding="utf-8") as f:
    page_code = f.read()

# Heading
page_code = page_code.replace(
    'className="text-4xl md:text-6xl font-extrabold tracking-tight text-content leading-tight mb-6 max-w-4xl"',
    'className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 text-transparent bg-clip-text"'
)

# Buttons
page_code = page_code.replace(
    'className="w-full sm:w-auto bg-accent-primary text-white px-8 py-3.5 rounded-[var(--radius-btn)] font-semibold text-base shadow-[var(--shadow-card-soft)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"',
    'className="w-full sm:w-auto bg-gradient-to-r from-accent-primary to-accent-secondary text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-accent-primary/20 hover:shadow-2xl hover:shadow-accent-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"'
)
page_code = page_code.replace(
    'className="w-full sm:w-auto bg-surface text-content border border-light px-8 py-3.5 rounded-[var(--radius-btn)] font-semibold text-base hover:bg-surface-tint transition-colors text-center"',
    'className="w-full sm:w-auto bg-surface/50 backdrop-blur-xl text-content border border-light/50 px-8 py-4 rounded-full font-bold text-lg hover:bg-surface-tint hover:-translate-y-0.5 transition-all text-center shadow-md"'
)

# Background Blobs
page_code = page_code.replace(
    '<div className="absolute top-10 left-10 w-[400px] h-[400px] bg-accent-primary opacity-10 rounded-full blur-[100px] -z-10" />',
    '<div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[120px] -z-10 animate-pulse mix-blend-multiply dark:mix-blend-screen" />'
)
page_code = page_code.replace(
    '<div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-accent-secondary opacity-10 rounded-full blur-[100px] -z-10" />',
    '<div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-secondary/20 rounded-full blur-[120px] -z-10 animate-pulse mix-blend-multiply dark:mix-blend-screen" style={{ animationDelay: "2s" }} />'
)

# Dashboard Mockup glow
page_code = page_code.replace(
    'className="w-full mt-20 relative p-2 rounded-[32px] bg-surface-tint shadow-[var(--shadow-soft)] border border-light glass"',
    'className="w-full mt-20 relative p-2 rounded-[32px] bg-surface-tint shadow-2xl shadow-accent-primary/10 border border-light/50 glass hover:scale-[1.01] transition-transform duration-700"'
)

with open("app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_code)

# 2. Update Legal Pages Layout to "Max"
legal_files = ["app/privacy/page.tsx", "app/terms/page.tsx", "app/cookies/page.tsx"]

def upgrade_legal_ui(file_path):
    if not os.path.exists(file_path): return
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace the wrapping divs for layout
    # Old: <div className="max-w-4xl mx-auto px-4 py-16">\n      <div className="mx-auto max-w-[65ch]">\n        <nav...
    # We want a 2-column grid layout on md+
    content = re.sub(
        r'<div className="max-w-4xl mx-auto px-4 py-16">\s*<div className="mx-auto max-w-\[65ch\]">',
        '<div className="max-w-6xl mx-auto px-4 py-16">\n      <div className="flex flex-col md:flex-row gap-12">',
        content
    )
    
    # Update Nav
    content = content.replace(
        '<nav className="mb-12 border-b border-light pb-8">',
        '<nav className="w-full md:w-64 shrink-0 md:sticky md:top-24 h-max">\n        <div className="p-6 bg-surface rounded-2xl shadow-sm border border-light/50">'
    )
    content = content.replace(
        '</ul>\n        </nav>',
        '</ul>\n        </div>\n        </nav>'
    )
    
    # Update Content wrapper
    content = content.replace(
        '<div className="space-y-8 text-content-secondary leading-relaxed">',
        '<div className="flex-1 space-y-12 text-content-secondary leading-relaxed bg-surface p-8 md:p-12 rounded-3xl shadow-sm border border-light/50">'
    )
    
    # End div closure
    # We replaced two divs with two divs, so closures should be fine, but let's ensure.
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Upgraded {file_path}")

for f in legal_files:
    upgrade_legal_ui(f)

print("UI upgraded successfully.")

