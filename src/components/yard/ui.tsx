import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CREW, SCORES } from "@/lib/yard/data";
import { useYard } from "@/lib/yard/store";

const fill: Record<(typeof SCORES)[number]["key"], string> = {
  ship: "bg-ship",
  craft: "bg-craft",
  crew: "bg-crew",
  word: "bg-word",
};

const ink: Record<(typeof SCORES)[number]["key"], string> = {
  ship: "text-ship",
  craft: "text-craft",
  crew: "text-crew",
  word: "text-word",
};

export function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-accent-dim font-mono text-base font-medium text-accent",
        className,
      )}
    >
      Y
    </span>
  );
}

export function Btn({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-accent text-bg hover:bg-accent/90",
        variant === "ghost" && "border border-line bg-card text-ink hover:border-accent-2",
        variant === "outline" && "border border-accent bg-transparent text-accent hover:bg-accent-dim",
        className,
      )}
      {...props}
    />
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-balance text-2xl font-semibold tracking-tight">{title}</h2>
      {sub ? <p className="mt-1 text-sm text-mute">{sub}</p> : null}
    </header>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card border border-line bg-surface p-4", className)}>{children}</section>
  );
}

export function ProofRow({ proof }: { proof: string }) {
  return (
    <div className="mt-3 rounded-lg border border-line bg-card px-3 py-2.5">
      <p className="text-xs font-medium tracking-widest text-accent">PROOF</p>
      <p className="mt-1 flex gap-2 font-mono text-xs leading-relaxed text-mute">
        <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
        <span className="break-all">{proof}</span>
      </p>
    </div>
  );
}

export function ScorePills() {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Reputation">
      {SCORES.map((score) => (
        <li
          key={score.key}
          className={cn("rounded-md bg-card px-2 py-1 font-mono text-xs", ink[score.key])}
          title={`${score.label} ${score.value}`}
        >
          {score.short} {score.value}
        </li>
      ))}
    </ul>
  );
}

export function ScoreBars({
  scores = SCORES,
}: {
  scores?: readonly { key: (typeof SCORES)[number]["key"]; label: string; value: number }[];
}) {
  return (
    <div className="my-4 space-y-2.5">
      {scores.map((score) => (
        <div key={score.key} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
          <span className={cn("font-mono text-xs tracking-wide", ink[score.key])}>{score.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-card-2" role="presentation">
            <div className={cn("h-full rounded-full", fill[score.key])} style={{ width: `${score.value}%` }} />
          </div>
          <span className="text-right font-mono text-xs text-mute tabular-nums">{score.value}</span>
        </div>
      ))}
    </div>
  );
}

export function isSelf(name: string) {
  const first = name.split("·")[0]?.trim().toLowerCase() ?? "";
  return first === "maya" || first === "0xmaya";
}

export function PersonMark({ name, className }: { name: string; className?: string }) {
  const avatar = useYard((state) => state.profile.avatar);
  const self = isSelf(name);
  if (self && avatar) {
    return <img src={avatar} alt="" className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
  const initial = (self ? "M" : name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-accent-dim font-mono text-sm text-accent",
        className,
      )}
    >
      {initial}
    </span>
  );
}

export function CrewChips() {
  const bio = useYard((state) => state.profile.bio);
  const openPerson = useYard((state) => state.openPerson);
  return (
    <ul className="mb-4 grid gap-2">
      {CREW.map((person) => (
        <li key={person.name}>
          <button
            type="button"
            onClick={() => openPerson(person.name.toLowerCase())}
            className="flex w-full items-center gap-3 rounded-lg bg-card px-3 py-2 text-left"
          >
            <PersonMark name={person.name} />
            <span className="min-w-0 text-sm">
              <span className="font-medium">{person.name}</span>
              <span className="text-mute"> · {person.role}</span>
              {person.name === "Maya" && bio ? <span className="mt-0.5 block truncate text-xs text-mute">{bio}</span> : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
