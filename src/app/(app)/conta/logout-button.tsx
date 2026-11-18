"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { endSession } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="secondary"
      size="lg"
      loading={loading}
      className="sm:w-fit"
      onClick={async () => {
        setLoading(true);
        await endSession();
        router.replace("/entrar");
        router.refresh();
      }}
    >
      Sair da conta
    </Button>
  );
}
