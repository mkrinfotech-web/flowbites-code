import { Suspense } from "react";
import AccountSignupForm from "./signup-form";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-flo-cream" />}>
      <AccountSignupForm />
    </Suspense>
  );
}
