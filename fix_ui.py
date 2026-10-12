import os
import re

legal_files = ["app/privacy/page.tsx", "app/terms/page.tsx", "app/cookies/page.tsx"]

for fpath in legal_files:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Fix the extra closing div
        content = content.replace('</div>\n        </nav>', '</nav>')
        
        # Replace the nav tag with the correct layout
        content = re.sub(
            r'<nav className="mb-8 rounded-\[var\(--radius-card\)\] bg-surface p-6 shadow-\[var\(--shadow-card-soft\)\] print:hidden">',
            '<nav className="w-full md:w-64 shrink-0 md:sticky md:top-24 h-max print:hidden">\n        <div className="p-6 bg-surface rounded-2xl shadow-sm border border-light/50">',
            content
        )
        
        # Add the closing div back correctly
        content = content.replace('</ul>\n        </nav>', '</ul>\n        </div>\n        </nav>')
        
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)

