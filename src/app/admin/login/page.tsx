import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#fef3f0,#f9dbd0_40%,#fa355822)] px-4">
      <LoginForm
        nextPath={params.next?.startsWith("/admin") ? params.next : "/admin"}
        errorParam={params.error}
      />
    </div>
  );
}
