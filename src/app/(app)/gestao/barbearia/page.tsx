import type { Metadata } from "next";
import { getSettings } from "@/server/data";
import { requireSession } from "@/server/session";
import { ShopForm } from "./shop-form";

export const metadata: Metadata = { title: "Barbearia · Hora do corte" };

export default async function BarbeariaPage() {
  await requireSession(["dono"]);
  return <ShopForm settings={await getSettings()} />;
}
