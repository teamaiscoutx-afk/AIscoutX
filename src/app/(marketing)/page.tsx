import { LandingPageContent } from "@/components/landing/landing-page-content";
import { tryCreateServerSupabaseClient } from "@/lib/supabase";

export default async function HomePage() {
  const supabase = tryCreateServerSupabaseClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const ctaHref = user ? "/dashboard" : "/login?mode=signup";

  return <LandingPageContent ctaHref={ctaHref} />;
}
