import { useEffect, useState } from "react";
import {
  Columns3,
  Eye,
  Home,
  IdCard,
  MessageSquare,
  Rocket,
  Search,
  ShieldCheck,
  Ship,
  Users,
} from "lucide-react";
import { DeskBody, PhoneBody } from "@/components/yard/screens";
import { Btn, Mark, PersonMark } from "@/components/yard/ui";
import { cn } from "@/lib/cn";
import type { DeskView, PhoneTab, YardTab } from "@/lib/yard/data";
import { PEOPLE, shipStageLabel } from "@/lib/yard/data";
import { useYard } from "@/lib/yard/store";

const RAIL: { id: DeskView; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "yard", label: "Yard", icon: Columns3 },
  { id: "ships", label: "Ships", icon: Ship },
  { id: "people", label: "People", icon: Users },
  { id: "launch", label: "Launch", icon: Rocket },
  { id: "diligence", label: "Dili.", icon: ShieldCheck },
  { id: "messages", label: "Log", icon: MessageSquare },
];

const YARD_TABS: { id: YardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "board", label: "Board" },
  { id: "repos", label: "Repos" },
  { id: "room", label: "Room" },
  { id: "window", label: "Window" },
  { id: "people", label: "People" },
];

const PHONE: { id: PhoneTab; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "watch", label: "Watch", icon: Eye },
  { id: "launch", label: "Launch", icon: Rocket },
  { id: "crew", label: "Crew", icon: Users },
  { id: "card", label: "Card", icon: IdCard },
];

export function Shell() {
  const nav = useYard((state) => state.nav);
  const yardTab = useYard((state) => state.yardTab);
  const phoneTab = useYard((state) => state.phoneTab);
  const unpublished = useYard((state) => state.unpublished);
  const ships = useYard((state) => state.ships);
  const toast = useYard((state) => state.toast);
  const modal = useYard((state) => state.modal);
  const setNav = useYard((state) => state.setNav);
  const setYardTab = useYard((state) => state.setYardTab);
  const setPhoneTab = useYard((state) => state.setPhoneTab);
  const openPublish = useYard((state) => state.openPublish);
  const cancelModal = useYard((state) => state.cancelModal);
  const publish = useYard((state) => state.publish);
  const avatar = useYard((state) => state.profile.avatar);
  const dismissToast = useYard((state) => state.dismissToast);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismissToast, 2800);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  useEffect(() => {
    if (modal !== "publish") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, cancelModal]);

  return (
    <div className="flex min-h-dvh bg-bg">
      <nav className="desk-only sticky top-0 flex h-dvh w-20 shrink-0 flex-col items-center gap-1 border-r border-line bg-card px-2 py-3" aria-label="Desktop">
        <button type="button" onClick={() => setNav("home")} className="mb-2" aria-label="YARD home">
          <Mark className="size-9 text-sm" />
        </button>
        {RAIL.map((item) => {
          const Icon = item.icon;
          const on = nav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setNav(item.id)}
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs",
                on ? "bg-accent-dim text-accent" : "text-mute hover:text-ink",
              )}
              aria-current={on ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setNav("me")}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-xs",
            nav === "me" ? "bg-accent-dim text-accent" : "text-mute hover:text-ink",
          )}
        >
          {avatar ? (
            <img src={avatar} alt="" className="size-6 rounded-full object-cover" />
          ) : (
            <IdCard className="size-4" aria-hidden />
          )}
          Me
        </button>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-card-2 px-3 sm:px-4">
          <span className="phone-only">
            <Mark className="size-8 rounded-lg text-sm" />
          </span>
          <label className="desk-only relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ships, people, crews, 0x…"
              className="w-full rounded-lg border border-line bg-bg py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-dim"
            />
          </label>
          <p className="phone-only min-w-0 flex-1 truncate text-sm font-medium">YARD</p>
          {unpublished ? (
            <button
              type="button"
              onClick={openPublish}
              className="shrink-0 rounded-full bg-accent-dim px-3 py-1.5 text-xs font-semibold text-accent"
            >
              Unpublished · vault-v2
            </button>
          ) : null}
        </header>
        <label className="phone-only relative block border-b border-line bg-card-2 px-3 py-2">
          <Search className="pointer-events-none absolute left-6 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ships, devs, crews, 0x…"
            className="w-full rounded-lg border border-line bg-bg py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-dim"
          />
        </label>

        {nav === "yard" ? (
          <div className="desk-only flex gap-1 overflow-x-auto border-b border-line bg-bg-2 px-3 py-2">
            {YARD_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setYardTab(tab.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  yardTab === tab.id ? "bg-accent-dim text-accent" : "text-mute",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <main className="canvas min-w-0 flex-1 overflow-auto">
            {query.trim() ? <SearchResults query={query} onClear={() => setQuery("")} /> : null}
            <div className={query.trim() ? "hidden" : undefined}>
              <div className="desk-only">
                <DeskBody />
              </div>
              <div className="phone-only">
                <PhoneBody />
              </div>
            </div>
          </main>
          <aside className="desk-only w-80 shrink-0 overflow-auto border-l border-line bg-bg-2 p-4">
            <Drawer />
          </aside>
        </div>
      </div>

      <nav className="phone-only tabbar fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card px-1 pt-1" aria-label="Phone">
        {PHONE.map((item) => {
          const Icon = item.icon;
          const on = phoneTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPhoneTab(item.id)}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
                on ? "text-accent" : "text-dim",
              )}
              aria-current={on ? "page" : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      {toast ? (
        <p className="toast-pos fixed inset-x-4 z-50 mx-auto max-w-sm rounded-xl border border-accent-2 bg-card-2 px-4 py-3 text-center text-sm shadow-lg">
          {toast}
        </p>
      ) : null}

      {modal === "publish" ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-bg/80 p-4"
          onClick={cancelModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="publish-title" className="text-lg font-semibold">
              Publish Ship Event?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              vault-v2 on Base. This hits the public feed and notifies Watchers. The proof is the deploy row on the ship.
            </p>
            <p className="mt-3 rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs text-mute">
              {ships.find((ship) => ship.id === "vault-v2")?.proofs.find((row) => row.kind === "Deploy")?.text ||
                "No deploy pinned."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Btn onClick={publish}>Publish</Btn>
              <Btn variant="ghost" onClick={cancelModal}>
                Keep private
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Drawer() {
  const ships = useYard((state) => state.ships);
  const unpublished = useYard((state) => state.unpublished);
  const openPublish = useYard((state) => state.openPublish);
  const deploy = ships.find((ship) => ship.id === "vault-v2")?.proofs.find((row) => row.kind === "Deploy")?.text;
  if (unpublished) {
    return (
      <div>
        <h3 className="text-xs font-medium tracking-widest text-accent">UNPUBLISHED</h3>
        <p className="mt-3 text-sm leading-relaxed text-mute">vault-v2 is still private. Publishing puts the deploy row on the feed.</p>
        <p className="mt-3 font-mono text-xs text-mute">{deploy || "No deploy pinned."}</p>
        <Btn className="mt-4 w-full" onClick={openPublish}>
          Publish Ship Event
        </Btn>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-xs font-medium tracking-widest text-accent">PROOF</h3>
      <p className="mt-3 text-sm leading-relaxed text-mute">The deploy row is on the feed.</p>
      <p className="mt-3 font-mono text-xs text-mute">{deploy || "No deploy pinned."}</p>
    </div>
  );
}

function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const setNav = useYard((state) => state.setNav);
  const setPhoneTab = useYard((state) => state.setPhoneTab);
  const openPerson = useYard((state) => state.openPerson);
  const openShip = useYard((state) => state.openShip);
  const ships = useYard((state) => state.ships);
  const bio = useYard((state) => state.profile.bio);
  const needle = query.trim().toLowerCase();
  const hits = [
    ...ships.flatMap((ship) => {
      const proofs = ship.proofs.map((row) => `${row.kind} ${row.text}`).join(" ");
      const detail = `${ship.crew.name} · ${ship.chain} · ${shipStageLabel(ship)}`;
      const blob = `${ship.name} ${ship.line} ${detail} ${proofs}`;
      if (!blob.toLowerCase().includes(needle)) return [];
      return [{ key: ship.id, label: ship.name, detail, mark: false, go: () => openShip(ship.id) }];
    }),
    ...PEOPLE.flatMap((person) => {
      const about = person.id === "maya" ? bio || person.focus : person.bio || person.focus;
      const blob = `${person.name} ${person.handle} ${person.role} ${person.focus} ${about}`;
      if (!blob.toLowerCase().includes(needle)) return [];
      return [
        {
          key: person.id,
          label: person.name,
          detail: about,
          mark: person.id === "maya",
          go: () => {
            if (person.id === "maya") {
              setNav("me");
              setPhoneTab("card");
              return;
            }
            openPerson(person.id);
          },
        },
      ];
    }),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Search</h2>
        <button type="button" onClick={onClear} className="text-sm text-accent">
          Clear
        </button>
      </div>
      <div className="grid gap-2">
        {hits.length === 0 ? (
          <p className="text-sm text-mute">No ships, devs, or teams for “{query.trim()}”.</p>
        ) : (
          hits.map((hit) => (
            <button
              key={hit.key}
              type="button"
              onClick={() => {
                hit.go();
                onClear();
              }}
              className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
            >
              {hit.mark ? <PersonMark name="0xMaya" /> : null}
              <span className="min-w-0">
                <span className="font-medium">{hit.label}</span>
                <span className="mt-1 block truncate text-sm text-mute">{hit.detail}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
