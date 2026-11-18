import type { Metadata } from "next";
import { listServices } from "@/server/data";
import { requireSession } from "@/server/session";
import { ServicesManager } from "./services-manager";

export const metadata: Metadata = { title: "Serviços · Hora do corte" };

export default async function ServicosPage() {
  await requireSession(["dono"]);
  const services = await listServices({ activeOnly: false });
  return <ServicesManager services={services} />;
}
