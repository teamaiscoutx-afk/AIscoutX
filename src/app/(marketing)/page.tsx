import { redirect } from "next/navigation";

import { LandingPageContent } from "@/components/landing/landing-page-content";
import { tryCreateServerSupabaseClient } from "@/lib/supabase";

type HomePageProps = {
  searchParams?: {
    signin?: string;
    redirect?: string;
  };
};

function safeRedirectPath(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = tryCreateServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user && searchParams?.signin === "1") {
    const target = safeRedirectPath(searchParams.redirect);
    redirect(`/login?mode=signin&redirect=${encodeURIComponent(target)}`);
  }

  const ctaHref = user ? "/dashboard" : "/login?mode=signup";

  return <LandingPageContent ctaHref={ctaHref} />;
}
