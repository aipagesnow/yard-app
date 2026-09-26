import { Github, Wallet } from "lucide-react";
import { Btn, Mark } from "@/components/yard/ui";
import { SCORES } from "@/lib/yard/data";
import { useYard } from "@/lib/yard/store";

export function Gate() {
  const signIn = useYard((state) => state.signIn);

  return (
    <main className="yard-grid grid min-h-dvh place-items-center px-4 py-10">
      <section className="gate-card w-full max-w-md rounded-2xl border border-line bg-surface px-6 py-8 sm:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Mark />
          <p className="text-xs font-medium tracking-widest text-accent">EVM BUILDERS</p>
        </div>
        <h1 className="text-balance text-5xl font-semibold tracking-tight">YARD</h1>
        <p className="mt-2 text-base text-mute">Claim your ships.</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Scores on a builder card">
          {SCORES.map((score) => (
            <li key={score.key} className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-mute">
              {score.label}
            </li>
          ))}
        </ul>
        <div className="mt-7 grid gap-2.5">
          <Btn onClick={signIn}>
            <Github className="size-4" aria-hidden />
            Continue with GitHub
          </Btn>
          <Btn variant="ghost" onClick={signIn}>
            <Wallet className="size-4" aria-hidden />
            Continue with wallet
          </Btn>
          <Btn variant="ghost" onClick={signIn}>
            Apple / Google
          </Btn>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-dim">
          Mock login. Signs you in as 0xMaya and backfills three real-looking deploys. No seed phrase. No lecture.
        </p>
      </section>
    </main>
  );
}
