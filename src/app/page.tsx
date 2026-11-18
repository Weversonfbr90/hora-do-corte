import { redirect } from "next/navigation";

// Enquanto o app não existe, a raiz leva para a demonstração do Design System.
export default function Home() {
  redirect("/design-system");
}
