import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams?: { redirect?: string };
};

/** Alias route — forwards to the main login page (sign-in mode). */
export default function SignInPage({ searchParams }: SignInPageProps) {
  const target = searchParams?.redirect ?? "/dashboard";
  const safe =
    target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
  redirect(`/login?mode=signin&redirect=${encodeURIComponent(safe)}`);
}
