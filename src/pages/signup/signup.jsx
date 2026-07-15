import { SignUp } from "@clerk/clerk-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <SignUp signInUrl="/login" forceRedirectUrl="/dashboard" />
    </div>
  );
}