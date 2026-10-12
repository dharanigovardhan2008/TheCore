import os
import re

files = ["app/privacy/page.tsx", "app/terms/page.tsx", "app/cookies/page.tsx"]

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Regex to remove the warning div
        pattern = r'<div className="mb-8 rounded-\[var\(--radius-card\)\] bg-accent-secondary/10 p-4 text-accent-secondary shadow-\[var\(--shadow-card-soft\)\]">\s*<strong>Important Note:</strong> Template generated for review.*?</div>'
        
        new_content = re.sub(pattern, "", content, flags=re.DOTALL)
        
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {fpath}")

