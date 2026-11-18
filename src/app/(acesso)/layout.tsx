import { Wordmark } from "@/components/ui";

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-surface-inverse px-4 pt-10 pb-16 text-fg-inverse sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-md">
          <Wordmark inverse className="text-h2" />
          <p className="mt-2 text-body text-creme-200">Agende seu corte em poucos toques.</p>
        </div>
      </header>
      <main className="-mt-10 flex-1 px-4 pb-12">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-5 shadow-md sm:p-8">{children}</div>
      </main>
    </div>
  );
}
