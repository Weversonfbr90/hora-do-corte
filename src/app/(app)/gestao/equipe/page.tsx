import type { Metadata } from "next";
import { listBarbers } from "@/server/data";
import { db } from "@/server/firebase-admin";
import { requireSession } from "@/server/session";
import { TeamManager, type TeamMember } from "./team-manager";

export const metadata: Metadata = { title: "Equipe · Hora do corte" };

export default async function EquipePage() {
  const session = await requireSession(["dono"]);
  const [barbers, suspendedSnap] = await Promise.all([
    listBarbers({ activeOnly: false }),
    db().collection("users").where("status", "==", "suspenso").get(),
  ]);
  const userSnaps = barbers.length ? await db().getAll(...barbers.map((b) => db().collection("users").doc(b.id))) : [];
  const users = new Map(userSnaps.filter((s) => s.exists).map((s) => [s.id, s.data()!]));

  const team: TeamMember[] = barbers
    .filter((b) => b.active || users.get(b.id)?.status === "suspenso")
    .map((b) => ({
      id: b.id,
      name: b.name,
      email: users.get(b.id)?.email ?? "",
      status: users.get(b.id)?.status === "suspenso" ? "suspenso" : "ativo",
      isOwner: b.id === session.uid,
      workDays: b.schedule.filter((d) => d.works).length,
    }));

  const teamIds = new Set(team.map((t) => t.id));
  const suspended = suspendedSnap.docs
    .filter((d) => !teamIds.has(d.id))
    .map((d) => ({ id: d.id, name: d.data().name as string, email: d.data().email as string }));

  return <TeamManager team={team} suspended={suspended} ownerId={session.uid} />;
}
