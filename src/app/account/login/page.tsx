import { Suspense } from "react";
import AccountLoginPage from "./login-form";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-flo-cream" />}>
      <AccountLoginPage />
    </Suspense>
  );
}
