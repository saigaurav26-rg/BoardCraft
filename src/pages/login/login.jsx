import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <SignIn signUpUrl="/signup" forceRedirectUrl="/dashboard" />
    </div>
  );
}