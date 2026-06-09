import { redirect } from "next/navigation";

export default function ValidateRedirect() {
  redirect("/dashboard/analyze");
}
