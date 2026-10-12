import re

with open("app/login/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace imports
code = code.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter, useSearchParams } from "next/navigation";\nimport { Suspense, useEffect } from "react";'
)

# Rename LoginPage to LoginContent and handle searchParams
code = code.replace(
    'export default function LoginPage() {',
    'function LoginContent() {\n  const searchParams = useSearchParams();\n  const initialMode = searchParams.get("mode") === "complete_google_signup" ? "complete_google_signup" : "login";'
)
code = code.replace(
    'const [mode, setMode] = useState<"login" | "signup">("login");',
    'const [mode, setMode] = useState<"login" | "signup" | "complete_google_signup">(initialMode);'
)

# Fetch user details if mode is complete_google_signup
fetch_user = """
  useEffect(() => {
    if (mode === "complete_google_signup") {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setEmail(data.user.email);
        }
        if (data?.user?.user_metadata?.full_name) {
          setName(data.user.user_metadata.full_name);
        }
      });
    }
  }, [mode, supabase]);
"""
code = code.replace('const supabase = createClient();', 'const supabase = createClient();\n' + fetch_user)

# Add agreedToTerms check for Google auth
google_auth_check = """
  const handleGoogleAuth = async () => {
    if ((mode === "signup" || mode === "complete_google_signup") && !agreedToTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }
"""
code = code.replace('const handleGoogleAuth = async () => {', google_auth_check)

# Update handleAuth to handle complete_google_signup
auth_submit_check = """
    if ((mode === "signup" || mode === "complete_google_signup") && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if ((mode === "signup" || mode === "complete_google_signup") && !agreedToTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }
"""
code = re.sub(r'if \(mode === "signup" && password !== confirmPassword\) \{.*?(?=// Dev Mode Bypass)', auth_submit_check, code, flags=re.DOTALL)

# Update submit logic for complete_google_signup
submit_logic = """
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else if (mode === "complete_google_signup") {
        const { error } = await supabase.auth.updateUser({ 
          password,
          data: { full_name: name }
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
"""
code = re.sub(r'if \(mode === "login"\) \{.*?\} else \{', submit_logic, code, flags=re.DOTALL)

# UI Updates
code = code.replace(
    '{mode === "login" ? "Sign in to your account" : "Create a new account"}',
    '{mode === "login" ? "Sign in to your account" : mode === "complete_google_signup" ? "Set a password to complete your account" : "Create a new account"}'
)

# Hide tabs if complete_google_signup
code = code.replace(
    '<div className="flex bg-surface-tint p-1 rounded-lg mb-6">',
    '{mode !== "complete_google_signup" && (\n<div className="flex bg-surface-tint p-1 rounded-lg mb-6">'
)
code = code.replace(
    '</button>\n        </div>',
    '</button>\n        </div>\n)}'
)

# Forms visibility
code = code.replace('mode === "signup" && (', '(mode === "signup" || mode === "complete_google_signup") && (')

# Email input disabled for complete_google_signup
code = code.replace(
    'onChange={(e) => setEmail(e.target.value)}',
    'onChange={(e) => setEmail(e.target.value)}\n              disabled={mode === "complete_google_signup"}'
)

# Submit button text
code = code.replace(
    'loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"',
    'loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "complete_google_signup" ? "Complete Account" : "Create Account"'
)

# Hide Google button if complete_google_signup
code = code.replace(
    '<div className="mt-6 flex items-center justify-center gap-3">',
    '{mode !== "complete_google_signup" && (\n<div className="mt-6 flex items-center justify-center gap-3">'
)
code = code.replace(
    'Continue with Google\n        </button>',
    'Continue with Google\n        </button>\n)}'
)

# Export default wrapper
export_wrapper = """
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4 bg-page">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
"""
code = code + "\n" + export_wrapper

with open("app/login/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)


