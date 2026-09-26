import { useState, type DragEvent } from "react";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Btn, isSelf, PageTitle, Panel, PersonMark, ProofRow, ScoreBars } from "@/components/yard/ui";
import {
  BIO_MAX,
  CHAINS,
  COLUMNS,
  COLUMN_ORDER,
  type ColKey,
  filterEvents,
  PEOPLE,
  personById,
  type Profile,
  profileHref,
  roleEvent,
  incidentEvent,
  shipEvents,
  showInWindow,
  STAGES,
  PROOF_KINDS,
  type IdeaAccess,
  type ShipWindow,
  windowLive,
  shipStageLabel,
  type Task,
  type YardShip,
} from "@/lib/yard/data";
import { readProfileImage } from "@/lib/yard/image";
import { useYard } from "@/lib/yard/store";
import { cn } from "@/lib/cn";

function Back({ label }: { label: string }) {
  const closeSheet = useYard((state) => state.closeSheet);
  return (
    <button
      type="button"
      onClick={closeSheet}
      className="mb-3 inline-flex items-center gap-1 text-sm text-accent"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}

export function EventCard({ id }: { id: string }) {
  const published = useYard((state) => state.published);
  const watches = useYard((state) => state.watches);
  const collects = useYard((state) => state.collects);
  const toggleWatch = useYard((state) => state.toggleWatch);
  const collect = useYard((state) => state.collect);
  const openShip = useYard((state) => state.openShip);
  const openDiligence = useYard((state) => state.openDiligence);
  const ships = useYard((state) => state.ships);
  const event =
    ships.map(incidentEvent).find((item) => item?.id === id) ??
    ships.map(roleEvent).find((item) => item?.id === id) ??
    shipEvents(ships, published).find((item) => item.id === id);
  if (!event) return null;
  const watching = watches.includes(event.shipId);
  const collected = collects.includes(event.id);
  const verbTone =
    event.kind === "incident"
      ? "bg-card text-bad"
      : event.kind === "audit"
        ? "text-word bg-card"
        : event.kind === "role"
          ? "bg-card text-crew"
          : "bg-accent-dim text-accent";

  return (
    <article className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isSelf(event.who) ? <PersonMark name={event.who} className="size-7 text-xs" /> : null}
          <p className="min-w-0 text-sm text-mute">
            {event.who} · {event.when}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-md px-2 py-1 text-xs font-semibold tracking-wide", verbTone)}>
          {event.verb}
        </span>
      </div>
      <h3 className="mt-2 text-balance text-lg font-semibold">{event.title}</h3>
      <p className="mt-1 text-sm text-mute">{event.body}</p>
      <ProofRow proof={event.proof} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn className="px-3 text-xs" onClick={() => collect(event.id)}>
          {collected ? "Collected" : "Collect"}
        </Btn>
        <Btn variant="outline" className="px-3 text-xs" onClick={() => toggleWatch(event.shipId)}>
          {watching ? "Watching" : "Watch"}
        </Btn>
        <Btn variant="ghost" className="px-3 text-xs" onClick={openDiligence}>
          Diligence
        </Btn>
        <Btn variant="ghost" className="px-3 text-xs" onClick={() => openShip(event.shipId)}>
          Open ship
        </Btn>
      </div>
    </article>
  );
}

export function Feed({ sidebar }: { sidebar?: boolean }) {
  const published = useYard((state) => state.published);
  const unpublished = useYard((state) => state.unpublished);
  const filter = useYard((state) => state.filter);
  const setFilter = useYard((state) => state.setFilter);
  const openPublish = useYard((state) => state.openPublish);
  const ships = useYard((state) => state.ships);
  const watches = useYard((state) => state.watches);
  const events = filterEvents(
    [...ships.map(incidentEvent).filter((event) => event != null), ...ships.map(roleEvent).filter((event) => event != null), ...shipEvents(ships, published).filter((event) => event.kind !== "role")],
    filter,
    watches,
  );
  const filters = [
    ["watched", "Watched"],
    ["deploys", "Deploys"],
    ["hiring", "Hiring"],
    ["incidents", "Incidents"],
  ] as const;

  const list = (
    <div>
      <PageTitle title="Home" sub="Ship Events from Watches. Not a timeline of gms." />
      {unpublished ? (
        <button
          type="button"
          onClick={openPublish}
          className="phone-only mb-4 w-full rounded-card border border-accent-2 bg-accent-dim px-4 py-3 text-left"
        >
          <p className="text-xs font-medium tracking-widest text-accent">UNPUBLISHED</p>
          <p className="mt-1 text-sm">vault-v2 is still private.</p>
        </button>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              filter === key ? "border-accent-2 bg-accent-dim text-accent" : "border-line bg-card text-mute",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {events.length === 0 ? (
          <Panel>
            <p className="text-sm text-mute">
              {filter === "incidents"
                ? "No incidents disclosed."
                : filter === "deploys"
                  ? "No public deploys yet. Publish vault-v2 from the yard."
                  : filter === "watched"
                    ? "Nothing from the ships you watch."
                    : "Nothing in this filter."}
            </p>
          </Panel>
        ) : (
          events.map((event) => <EventCard key={event.id} id={event.id} />)
        )}
      </div>
    </div>
  );

  if (!sidebar) return list;

  const counts = [
    ...ships.map(incidentEvent).filter((event) => event != null),
    ...ships.map(roleEvent).filter((event) => event != null),
    ...shipEvents(ships, published).filter((event) => event.kind !== "role"),
  ];
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,42rem)_16rem]">
      {list}
      <aside className="grid gap-3">
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">LIVE HOUR</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            {counts.filter((event) => event.kind === "deploy").length} deploy
            <br />
            {counts.filter((event) => event.kind === "audit").length} audit
            <br />
            {counts.filter((event) => event.kind === "role").length} open role
            <br />
            {counts.filter((event) => event.kind === "incident").length} incident
          </p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">WATCHING</h3>
          <WatchList compact />
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">YOUR QUEUE</h3>
          <p className="mt-2 text-sm text-mute">
            {unpublished ? "1 unpublished deploy — vault-v2" : "Queue clear. Last event published."}
          </p>
          {unpublished ? (
            <Btn className="mt-3 px-3 py-2 text-xs" onClick={openPublish}>
              Publish
            </Btn>
          ) : null}
        </Panel>
      </aside>
    </div>
  );
}

export function Board() {
  const tasks = useYard((state) => state.tasks);
  const unpublished = useYard((state) => state.unpublished);
  const moveTask = useYard((state) => state.moveTask);
  const openPublish = useYard((state) => state.openPublish);
  const [over, setOver] = useState<ColKey | null>(null);

  function onDrop(column: ColKey, event: DragEvent) {
    event.preventDefault();
    setOver(null);
    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { id?: string; from?: ColKey };
      if (!data.id || !data.from) return;
      moveTask(data.id, data.from, column);
    } catch {
      /* ignore a bad drag payload */
    }
  }

  return (
    <div>
      <PageTitle title="Harbor · Board" sub="Private HQ. Work cards live here. A ship goes on Home only when you put it there." />
      <NewShip />
      <div className="w-full min-w-0 overflow-x-auto pb-2">
        <div className="board-grid">
          {COLUMNS.map((column) => (
            <section
              key={column.key}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(column.key);
              }}
              onDragLeave={() => setOver((current) => (current === column.key ? null : current))}
              onDrop={(event) => onDrop(column.key, event)}
              className={cn(
                "flex min-h-80 flex-col rounded-card border bg-surface p-3",
                over === column.key ? "border-accent" : "border-line",
              )}
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-medium tracking-widest text-accent">{column.label}</h3>
                <span className="font-mono text-xs text-dim">{tasks[column.key].length}</span>
              </header>
              <div className="grid gap-2">
                {tasks[column.key].map((task) => (
                  <TaskCard key={task.id} task={task} column={column.key} />
                ))}
              </div>
              {column.key === "shipped" && unpublished ? (
                <Btn variant="outline" className="mt-3 w-full text-xs" onClick={openPublish}>
                  Publish
                </Btn>
              ) : null}
              {tasks[column.key].length === 0 && column.key === "shipped" ? (
                <p className="mt-3 text-xs leading-relaxed text-dim">Drop a card here to open the ship event.</p>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const ships = useYard((state) => state.ships);
  const unpublished = useYard((state) => state.unpublished);
  const openShip = useYard((state) => state.openShip);
  const waiting = ships.reduce(
    (count, ship) => count + (ship.mine ? ship.notes.filter((note) => note.status === "pending").length : 0),
    0,
  );

  return (
    <div>
      <PageTitle
        title="Harbor · Overview"
        sub={unpublished ? "vault-v2 still has an unpublished deploy." : "No unpublished deploy in the queue."}
      />
      {waiting > 0 ? (
        <p className="mb-3 text-sm text-mute">
          {waiting} {waiting === 1 ? "suggestion" : "suggestions"} waiting.
        </p>
      ) : null}
      <ul className="grid max-w-xl gap-2">
        {ships.map((ship) => {
          const pending = ship.mine ? ship.notes.filter((note) => note.status === "pending").length : 0;
          return (
            <li key={ship.id}>
              <button
                type="button"
                onClick={() => openShip(ship.id)}
                className="w-full rounded-card border border-line bg-surface p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{ship.name}</h3>
                  <span className="shrink-0 text-xs text-accent">{ship.sunset ? "Sunset" : ship.stage}</span>
                </div>
                <p className="mt-1 text-sm text-mute">
                  {ship.crew.name} · {ship.chain}
                  {windowLive(ship.stage) && !ship.sunset ? " · Window open" : " · Window closed"}
                </p>
                {pending > 0 ? <p className="mt-1 text-xs text-accent">{pending} to keep or drop</p> : null}
                {ship.stage === "Testnet" && ship.seats ? (
                  <p className="mt-1 text-xs text-mute">
                    {ship.seats.count} {ship.seats.count === 1 ? "seat" : "seats"}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TaskCard({ task, column }: { task: Task; column: ColKey }) {
  const moveTask = useYard((state) => state.moveTask);
  const published = useYard((state) => state.published);
  const ships = useYard((state) => state.ships);
  const openShip = useYard((state) => state.openShip);
  const index = COLUMN_ORDER.indexOf(column);
  const next = COLUMN_ORDER[index + 1];
  const prev = COLUMN_ORDER[index - 1];
  const linked = ships.some((ship) => ship.id === task.id);

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({ id: task.id, from: column }));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "group relative cursor-grab rounded-lg border border-transparent bg-card p-3 active:cursor-grabbing",
        column === "shipped" && "border-accent-2",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-4 shrink-0 text-dim" aria-hidden />
        <div className="min-w-0 flex-1">
          {linked ? (
            <button type="button" onClick={() => openShip(task.id)} className="text-left">
              <h4 className={cn("text-sm font-medium", column === "shipped" && "text-accent")}>{task.title}</h4>
            </button>
          ) : (
            <h4 className={cn("text-sm font-medium", column === "shipped" && "text-accent")}>{task.title}</h4>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-mute">
            {isSelf(task.who) ? <PersonMark name={task.who} className="size-4 text-[10px]" /> : null}
            <span>
              {task.who}
              {task.shipId ? ` · ${ships.find((ship) => ship.id === task.shipId)?.name ?? task.shipId}` : ""}
              {column === "shipped" ? (published ? " · on the feed" : " · ready") : ""}
            </span>
          </p>
        </div>
      </div>
      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {prev ? (
          <button
            type="button"
            aria-label={`Move back to ${prev}`}
            className="grid size-7 place-items-center rounded-md text-mute hover:bg-surface hover:text-ink"
            onClick={() => moveTask(task.id, column, prev)}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
        ) : null}
        {next ? (
          <button
            type="button"
            aria-label={`Move forward to ${next}`}
            className="grid size-7 place-items-center rounded-md text-accent hover:bg-accent-dim"
            onClick={() => moveTask(task.id, column, next)}
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Repos() {
  const ships = useYard((state) => state.ships);
  const openShip = useYard((state) => state.openShip);
  return (
    <div>
      <PageTitle title="Repos" sub="No file tree. The ship is the record." />
      <ul className="grid max-w-xl gap-2">
        {ships.map((ship) => (
          <li key={ship.id}>
            <button
              type="button"
              onClick={() => openShip(ship.id)}
              className="w-full rounded-card border border-line bg-surface p-4 text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{ship.name}</h3>
                <span className="shrink-0 text-xs text-accent">{ship.sunset ? "Sunset" : ship.stage}</span>
              </div>
              <p className="mt-1 text-sm text-mute">
                {ship.chain} · {ship.crew.name}
              </p>
              <p className="mt-2 text-sm">{ship.proofs.length ? ship.proofs.map((row) => `${row.kind} · ${row.text}`).join(" · ") : "No proof pinned."}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoomInbox() {
  const ships = useYard((state) => state.ships);
  const unpublished = useYard((state) => state.unpublished);
  const openShip = useYard((state) => state.openShip);
  const openPerson = useYard((state) => state.openPerson);
  const setNoteStatus = useYard((state) => state.setNoteStatus);
  const setIdeaStatus = useYard((state) => state.setIdeaStatus);
  const acceptTester = useYard((state) => state.acceptTester);
  const acceptRole = useYard((state) => state.acceptRole);
  const declineTester = useYard((state) => state.declineTester);
  const declineRole = useYard((state) => state.declineRole);
  const rows = ships
    .filter((ship) => ship.mine)
    .flatMap((ship) => {
      const notes = ship.notes
        .filter((note) => note.status === "pending")
        .map((note) => ({
          key: `note-${note.id}`,
          ship,
          personId: note.personId,
          kind: "Suggestion",
          text: note.text,
          keep: () => setNoteStatus(ship.id, note.id, "kept"),
          drop: () => setNoteStatus(ship.id, note.id, "dropped"),
        }));
      const ideas = (ship.ideas?.ideas ?? [])
        .filter((idea) => idea.status === "pending")
        .map((idea) => ({
          key: `idea-${idea.id}`,
          ship,
          personId: idea.personId,
          kind: "Idea",
          text: idea.text,
          keep: () => setIdeaStatus(ship.id, idea.id, "kept"),
          drop: () => setIdeaStatus(ship.id, idea.id, "dropped"),
        }));
      const testers = ship.applications
        .filter((entry) => entry.status === "pending" && ship.seats)
        .map((entry) => ({
          key: `seat-${entry.personId}`,
          ship,
          personId: entry.personId,
          kind: "Testnet",
          text: ship.seats?.brief || "Wants a seat.",
          keep: () => acceptTester(ship.id, entry.personId),
          drop: () => declineTester(ship.id, entry.personId),
        }));
      const roles = ship.roleApps
        .filter((entry) => entry.status === "pending" && ship.role?.open)
        .map((entry) => ({
          key: `role-${entry.personId}`,
          ship,
          personId: entry.personId,
          kind: "Role",
          text: ship.role?.title || "Wants the role.",
          keep: () => acceptRole(ship.id, entry.personId),
          drop: () => declineRole(ship.id, entry.personId),
        }));
      return [...notes, ...ideas, ...testers, ...roles];
    });

  return (
    <div>
      <PageTitle title="Room" sub="Private. What is waiting on you. Not a chat." />
      {unpublished ? (
        <p className="mb-3 text-sm text-mute">vault-v2 still has an unpublished deploy. Publish it from the board.</p>
      ) : null}
      {rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-mute">Nothing waiting.</p>
        </Panel>
      ) : (
        <ul className="grid max-w-xl gap-2">
          {rows.map((row) => {
            const person = personById(row.personId);
            if (!person) return null;
            return (
              <li key={row.key} className="rounded-card border border-line bg-surface p-4">
                <p className="text-xs font-medium tracking-widest text-dim">{row.kind}</p>
                <p className="mt-2 text-sm">
                  <button type="button" onClick={() => openPerson(person.id)} className="font-medium text-accent">
                    {person.name}
                  </button>
                  <span className="text-mute"> · </span>
                  <button type="button" onClick={() => openShip(row.ship.id)} className="text-accent">
                    {row.ship.name}
                  </button>
                </p>
                <p className="mt-1 text-sm text-mute">{row.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn className="px-3 text-xs" onClick={row.keep}>
                    {row.kind === "Testnet" || row.kind === "Role" ? "Accept" : "Keep"}
                  </Btn>
                  {row.drop ? (
                    <Btn variant="ghost" className="px-3 text-xs" onClick={row.drop}>
                      Drop
                    </Btn>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function YardScreen() {
  const yardTab = useYard((state) => state.yardTab);
  if (yardTab === "board") return <Board />;
  if (yardTab === "overview") return <Overview />;
  if (yardTab === "repos") return <Repos />;
  if (yardTab === "room") return <RoomInbox />;
  if (yardTab === "window") return <WindowTab />;
  return <CrewScreen />;
}

const field =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-dim";

const WINDOW_ROWS: { key: keyof ShipWindow; label: string }[] = [
  { key: "proof", label: "Proof" },
  { key: "crew", label: "Crew" },
  { key: "ideas", label: "Kept ideas" },
  { key: "testers", label: "Testnet" },
];

function WindowEditor({ ship }: { ship: YardShip }) {
  const saveWindow = useYard((state) => state.saveWindow);
  const setPreview = useYard((state) => state.setPreview);
  const [draft, setDraft] = useState(ship.window);

  return (
    <form
      className="mt-4 grid max-w-xl gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        saveWindow(ship.id, draft);
      }}
    >
      <p className="text-xs font-medium tracking-widest text-dim">PUBLIC WINDOW</p>
      <p className="text-sm text-mute">Other people see only what is on. The board and your edits stay in the yard.</p>
      {WINDOW_ROWS.map((row) => (
        <label key={row.key} className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft[row.key]}
            onChange={(event) => setDraft((current) => ({ ...current, [row.key]: event.target.checked }))}
            className="size-4 accent-accent"
          />
          {row.label}
        </label>
      ))}
      <div className="flex flex-wrap gap-2">
        <Btn type="submit" className="px-3 text-xs">
          Save window
        </Btn>
        <Btn type="button" variant="ghost" className="px-3 text-xs" onClick={() => setPreview(true)}>
          See the window
        </Btn>
      </div>
    </form>
  );
}

function WindowTab() {
  const ships = useYard((state) => state.ships);
  const openShip = useYard((state) => state.openShip);
  const mine = ships.filter((ship) => ship.mine);

  return (
    <div>
      <PageTitle title="Window" sub="Public is a chosen window. The HQ stays private." />
      {mine.length === 0 ? (
        <Panel>
          <p className="text-sm text-mute">No ship of yours in the yard.</p>
        </Panel>
      ) : (
        <ul className="grid max-w-xl gap-3">
          {mine.map((ship) => {
            const live = !ship.sunset && windowLive(ship.stage);
            return (
              <li key={ship.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{ship.name}</h3>
                  <span className="shrink-0 text-xs text-accent">{shipStageLabel(ship)}</span>
                </div>
                {ship.sunset ? (
                  <p className="mt-3 text-sm text-mute">Sunset. The window is closed.</p>
                ) : live ? (
                  <WindowEditor key={ship.id} ship={ship} />
                ) : (
                  <p className="mt-3 text-sm text-mute">The window opens on Mainnet. {ship.name} is on {ship.stage}.</p>
                )}
                <Btn type="button" variant="ghost" className="mt-3 px-3 text-xs" onClick={() => openShip(ship.id)}>
                  Open {ship.name}
                </Btn>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PreviewBar() {
  const preview = useYard((state) => state.preview);
  const setPreview = useYard((state) => state.setPreview);
  if (!preview) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-3 py-2">
      <p className="text-sm">This is the public window.</p>
      <Btn type="button" variant="ghost" className="px-3 text-xs" onClick={() => setPreview(false)}>
        Back to the yard
      </Btn>
    </div>
  );
}

function ShipFields({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; chain: string; line: string };
  submitLabel: string;
  onSubmit: (value: { name: string; chain: string; line: string }) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [chain, setChain] = useState(initial?.chain ?? "Base");
  const [line, setLine] = useState(initial?.line ?? "");
  const [error, setError] = useState("");
  const options = CHAINS.includes(chain as (typeof CHAINS)[number]) ? CHAINS : [chain, ...CHAINS];

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) {
          setError("Name the ship.");
          return;
        }
        onSubmit({ name, chain, line });
      }}
    >
      <label className="grid gap-1">
        <span className="text-xs font-medium tracking-widest text-dim">NAME</span>
        <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} className={field} />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-medium tracking-widest text-dim">CHAIN</span>
        <select value={chain} onChange={(event) => setChain(event.target.value)} className={field}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-medium tracking-widest text-dim">ONE LINE</span>
        <input
          value={line}
          maxLength={140}
          placeholder="What this ship is"
          onChange={(event) => setLine(event.target.value)}
          className={field}
        />
      </label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Btn type="submit" className="px-3 text-xs">
          {submitLabel}
        </Btn>
        {onCancel ? (
          <Btn type="button" variant="ghost" className="px-3 text-xs" onClick={onCancel}>
            Cancel
          </Btn>
        ) : null}
      </div>
    </form>
  );
}

function NewShip() {
  const createShip = useYard((state) => state.createShip);
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Btn variant="outline" className="mb-4 px-3 text-xs" onClick={() => setOpen(true)}>
        New ship
      </Btn>
    );
  }
  return (
    <Panel className="mb-4 max-w-xl">
      <h3 className="mb-3 text-sm font-semibold">New ship</h3>
      <ShipFields
        submitLabel="Put in Icebox"
        onCancel={() => setOpen(false)}
        onSubmit={(value) => {
          createShip(value);
          setOpen(false);
        }}
      />
    </Panel>
  );
}

const STAGE_COPY: Record<(typeof STAGES)[number], string> = {
  Idea: "Still an idea. Nothing public but the name.",
  Private: "In the yard. The window is closed.",
  Testnet: "Seats are for this window. Testers are not Harbor crew.",
  Audit: "Pin an audit row before Mainnet.",
  Mainnet: "Ready for the public window.",
  Alive: "Live. Proof stays if you step back.",
};

type DraftSection = { id: string; name: string; prompt: string };

function nextSectionId(sections: DraftSection[]) {
  for (let n = 1; n <= 3; n += 1) {
    const id = `s${n}`;
    if (!sections.some((section) => section.id === id)) return id;
  }
  return "s3";
}

function IdeaRoomBlock({ ship }: { ship: YardShip }) {
  const saveIdeaRoom = useYard((state) => state.saveIdeaRoom);
  const setIdeaStatus = useYard((state) => state.setIdeaStatus);
  const voteIdea = useYard((state) => state.voteIdea);
  const submitIdea = useYard((state) => state.submitIdea);
  const openPerson = useYard((state) => state.openPerson);
  const room = ship.ideas;
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview;
  const [access, setAccess] = useState<IdeaAccess>(room?.access ?? "open");
  const [links, setLinks] = useState(room?.links ?? false);
  const [votes, setVotes] = useState(room?.votes ?? false);
  const [sections, setSections] = useState<DraftSection[]>(
    room?.sections ?? [{ id: "s1", name: "", prompt: "" }],
  );
  const [text, setText] = useState("");
  const [ideaLink, setIdeaLink] = useState("");
  const [sectionId, setSectionId] = useState(room?.sections[0]?.id ?? "s1");
  const [error, setError] = useState("");
  const kept = room?.ideas.filter((idea) => idea.status === "kept") ?? [];
  const visible = ship.stage === "Idea" ? (room?.ideas.filter((idea) => idea.status !== "dropped") ?? []) : kept;

  if (ship.stage !== "Idea" && !showInWindow(ship, "ideas", asYard)) return null;
  if (ship.stage !== "Idea" && kept.length === 0) return null;

  return (
    <div className="mt-4 max-w-xl">
      {asYard && ship.stage === "Idea" ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (sections.some((section) => !section.name.trim() || !section.prompt.trim())) {
              setError("Name each section, and give it a prompt.");
              return;
            }
            saveIdeaRoom(ship.id, { access, links, votes, sections });
            setError("");
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">WHO CAN SUBMIT</span>
            <select value={access} onChange={(event) => setAccess(event.target.value as IdeaAccess)} className={field}>
              <option value="open">Anyone with a card</option>
              <option value="crew">Harbor crew only</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={links} onChange={(event) => setLinks(event.target.checked)} className="size-4 accent-accent" />
            Allow one link
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={votes} onChange={(event) => setVotes(event.target.checked)} className="size-4 accent-accent" />
            Votes, one per card
          </label>
          {sections.map((section, index) => (
            <div key={section.id} className="grid gap-2 rounded-lg bg-card p-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">SECTION {index + 1}</span>
                <input
                  value={section.name}
                  maxLength={32}
                  placeholder="Exit"
                  onChange={(event) =>
                    setSections((current) => current.map((item) => (item.id === section.id ? { ...item, name: event.target.value } : item)))
                  }
                  className={field}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">PROMPT</span>
                <input
                  value={section.prompt}
                  maxLength={80}
                  placeholder="What should the exit do?"
                  onChange={(event) =>
                    setSections((current) => current.map((item) => (item.id === section.id ? { ...item, prompt: event.target.value } : item)))
                  }
                  className={field}
                />
              </label>
              {sections.length > 1 ? (
                <Btn
                  type="button"
                  variant="ghost"
                  className="px-3 text-xs"
                  onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}
                >
                  Remove section
                </Btn>
              ) : null}
            </div>
          ))}
          {sections.length < 3 ? (
            <Btn
              type="button"
              variant="outline"
              className="px-3 text-xs"
              onClick={() => setSections((current) => [...current, { id: nextSectionId(current), name: "", prompt: "" }])}
            >
              Add section
            </Btn>
          ) : null}
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Btn type="submit" className="px-3 text-xs">
            Save room
          </Btn>
        </form>
      ) : null}
      {room && ship.stage === "Idea" ? (
        <p className="mt-3 text-sm text-mute">
          {room.access === "closed" ? "Closed. No new ideas." : room.access === "crew" ? "Harbor crew only." : "Anyone with a card."}
          {room.links ? " One link each." : " No links."}
          {room.votes ? " One vote per card." : " No votes."}
        </p>
      ) : null}
      {visible.length > 0
        ? room?.sections.map((section) => {
            const list = visible.filter((idea) => idea.sectionId === section.id);
            if (!list.length) return null;
            return (
              <div key={section.id} className="mt-4">
                <p className="text-xs font-medium tracking-widest text-dim">{section.name}</p>
                <p className="mt-1 text-sm text-mute">{section.prompt}</p>
                <ul className="mt-2 grid gap-2">
                  {list.map((idea) => {
                    const person = personById(idea.personId);
                    const href = profileHref(idea.link);
                    const voted = idea.votes.includes("maya");
                    if (!person) return null;
                    if (!ship.mine && idea.status !== "kept") return null;
                    return (
                      <li key={idea.id} className="rounded-lg bg-card px-3 py-2">
                        <button type="button" onClick={() => openPerson(person.id)} className="text-left text-sm font-medium">
                          {person.name}
                        </button>
                        <p className="mt-1 text-sm">{idea.text}</p>
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-accent">
                            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{idea.link.trim()}</span>
                          </a>
                        ) : null}
                        {ship.mine && ship.stage === "Idea" && idea.status === "pending" ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Btn className="px-3 text-xs" onClick={() => setIdeaStatus(ship.id, idea.id, "kept")}>
                              Keep
                            </Btn>
                            <Btn variant="ghost" className="px-3 text-xs" onClick={() => setIdeaStatus(ship.id, idea.id, "dropped")}>
                              Drop
                            </Btn>
                          </div>
                        ) : null}
                        {idea.status === "kept" && room.votes && ship.stage === "Idea" && idea.personId !== "maya" ? (
                          <Btn variant="ghost" className="mt-2 px-3 text-xs" onClick={() => voteIdea(ship.id, idea.id)}>
                            {voted ? "Voted" : "Vote"} · {idea.votes.length}
                          </Btn>
                        ) : null}
                        {idea.status === "kept" && room.votes && idea.personId === "maya" ? (
                          <p className="mt-2 text-xs text-mute">{idea.votes.length} votes</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        : null}
      {!ship.mine && ship.stage === "Idea" && room && room.access !== "closed" ? (
        <form
          className="mt-4 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) {
              setError("Write the idea.");
              return;
            }
            submitIdea(ship.id, sectionId, text, ideaLink);
            setText("");
            setIdeaLink("");
            setError("");
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">YOUR IDEA</span>
            {room.sections.length > 1 ? (
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className={field}>
                {room.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            ) : null}
            <input value={text} maxLength={280} onChange={(event) => setText(event.target.value)} className={field} />
          </label>
          {room.links ? (
            <input
              value={ideaLink}
              maxLength={200}
              placeholder="https://…"
              onChange={(event) => setIdeaLink(event.target.value)}
              className={field}
            />
          ) : null}
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Btn type="submit" className="px-3 text-xs">
            Send idea
          </Btn>
        </form>
      ) : null}
    </div>
  );
}

function ShipStagePanel({ ship }: { ship: YardShip }) {
  const stepStage = useYard((state) => state.stepStage);
  const setSunset = useYard((state) => state.setSunset);
  const release = useYard((state) => state.release);
  const openPublish = useYard((state) => state.openPublish);
  const saveSeats = useYard((state) => state.saveSeats);
  const saveProof = useYard((state) => state.saveProof);
  const applySeat = useYard((state) => state.applySeat);
  const acceptTester = useYard((state) => state.acceptTester);
  const declineTester = useYard((state) => state.declineTester);
  const openPerson = useYard((state) => state.openPerson);
  const index = STAGES.indexOf(ship.stage);
  const [count, setCount] = useState(String(ship.seats?.count ?? 3));
  const [brief, setBrief] = useState(ship.seats?.brief ?? "");
  const [link, setLink] = useState(ship.seats?.link ?? "");
  const [rows, setRows] = useState(() =>
    Object.fromEntries(PROOF_KINDS.map((kind) => [kind, ship.proofs.find((row) => row.kind === kind)?.text ?? ""])) as Record<
      (typeof PROOF_KINDS)[number],
      string
    >,
  );
  const [error, setError] = useState("");
  const href = profileHref(ship.seats?.link ?? "");
  const accepted = ship.applications.filter((entry) => entry.status === "accepted");
  const pending = ship.applications.filter((entry) => entry.status === "pending");
  const mineApp = ship.applications.find((entry) => entry.personId === "maya");
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview;
  const hideTesters = windowLive(ship.stage) && !showInWindow(ship, "testers", asYard);

  if (ship.sunset) {
    return (
      <div className="mb-5 max-w-xl">
        <h3 className="text-xs font-medium tracking-widest text-dim">SUNSET</h3>
        <p className="mt-2 text-sm text-mute">Closed clean. The record stays.</p>
        {asYard ? (
          <Btn variant="ghost" className="mt-3 px-3 text-xs" onClick={() => setSunset(ship.id, false)}>
            Reopen
          </Btn>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="relative">
        <div className="absolute inset-x-0 top-1.5 h-px bg-line" aria-hidden />
        <div
          className="absolute top-1.5 left-0 h-px bg-accent"
          style={{ width: `${(index / (STAGES.length - 1)) * 100}%` }}
          aria-hidden
        />
        <ol className="relative flex" aria-label="Stage">
          {STAGES.map((stage, stageIndex) => {
            const on = stageIndex <= index;
            const here = stageIndex === index;
            return (
              <li key={stage} className="flex min-w-0 flex-1 flex-col items-center gap-2" aria-current={here ? "step" : undefined}>
                <span
                  className={cn(
                    "relative z-10 size-3 rounded-full",
                    on ? "bg-accent" : "border border-line bg-bg",
                    here && "ring-4 ring-accent-dim",
                  )}
                />
                <span className={cn("text-center text-xs leading-tight", here ? "font-medium text-accent" : on ? "text-mute" : "text-dim")}>
                  {stage}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-4 text-sm text-mute">{STAGE_COPY[ship.stage]}</p>
      {showInWindow(ship, "proof", asYard) && ship.proofs.length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {ship.proofs.map((row) => (
            <li key={row.kind} className="text-sm">
              <span className="text-dim">{row.kind}</span> · {row.text}
            </li>
          ))}
        </ul>
      ) : null}
      {asYard ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn variant="ghost" className="px-3 text-xs" disabled={index === 0} onClick={() => stepStage(ship.id, -1)}>
            Back
          </Btn>
          <Btn className="px-3 text-xs" disabled={index === STAGES.length - 1} onClick={() => stepStage(ship.id, 1)}>
            Next
          </Btn>
          {windowLive(ship.stage) ? (
            <Btn variant="ghost" className="px-3 text-xs" onClick={() => setSunset(ship.id, true)}>
              Sunset
            </Btn>
          ) : null}
          {ship.stage === "Alive" && !ship.released ? (
            <Btn className="px-3 text-xs" onClick={() => (ship.id === "vault-v2" ? openPublish() : release(ship.id))}>
              Put on Home
            </Btn>
          ) : null}
        </div>
      ) : null}
      {asYard && ship.stage === "Alive" ? (
        <p className="mt-3 text-sm text-mute">{ship.released ? "On Home." : "Alive, and not on Home yet."}</p>
      ) : null}
      <IdeaRoomBlock ship={ship} />
      {asYard && windowLive(ship.stage) ? <WindowEditor key={ship.id} ship={ship} /> : null}
      {asYard && STAGES.indexOf(ship.stage) >= STAGES.indexOf("Audit") ? (
        <form
          className="mt-4 grid max-w-xl gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveProof(
              ship.id,
              PROOF_KINDS.map((kind) => ({ kind, text: rows[kind] })),
            );
            setError(ship.stage === "Audit" && !rows.Audit.trim() ? "Pin an audit row before Mainnet." : "");
          }}
        >
          {PROOF_KINDS.map((kind) => (
            <label key={kind} className="grid gap-1">
              <span className="text-xs font-medium tracking-widest text-dim">{kind}</span>
              <input
                value={rows[kind]}
                maxLength={160}
                placeholder={kind === "Audit" ? "Who audited it, and the hash" : kind === "Deploy" ? "Chain and address" : "What was run"}
                onChange={(event) => setRows((current) => ({ ...current, [kind]: event.target.value }))}
                className={field}
              />
            </label>
          ))}
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Btn type="submit" className="px-3 text-xs">
            Pin proof
          </Btn>
        </form>
      ) : null}
      {!hideTesters && (ship.stage === "Testnet" || accepted.length > 0) ? (
        <div className="mt-4 max-w-xl">
          {ship.stage === "Testnet" && ship.seats ? (
            <div>
              <p className="text-sm">
                {ship.seats.count} {ship.seats.count === 1 ? "seat" : "seats"} · {ship.seats.brief}
              </p>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-accent">
                  <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{ship.seats.link.trim()}</span>
                </a>
              ) : null}
            </div>
          ) : null}
          {ship.mine && ship.stage === "Testnet" && asYard ? (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!brief.trim()) {
                  setError("Say what to try.");
                  return;
                }
                saveSeats(ship.id, { count: Number(count), brief, link });
                setError("");
              }}
            >
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">SEATS</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  className={field}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">WHAT TO TRY</span>
                <input
                  value={brief}
                  maxLength={140}
                  placeholder="Walk the deposit and the exit"
                  onChange={(event) => setBrief(event.target.value)}
                  className={field}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">APPLY LINK</span>
                <input
                  value={link}
                  maxLength={200}
                  placeholder="https://…"
                  onChange={(event) => setLink(event.target.value)}
                  className={field}
                />
              </label>
              {error ? <p className="text-sm text-bad">{error}</p> : null}
              <Btn type="submit" className="px-3 text-xs">
                Save seats
              </Btn>
            </form>
          ) : null}
          {!ship.mine && ship.stage === "Testnet" && ship.seats ? (
            <div className="mt-3">
              {mineApp?.status === "declined" ? (
                <p className="text-sm text-mute">Declined.</p>
              ) : mineApp ? (
                <p className="text-sm text-accent">Applied with your card.</p>
              ) : (
                <Btn className="px-3 text-xs" onClick={() => applySeat(ship.id)}>
                  Apply with your card
                </Btn>
              )}
            </div>
          ) : null}
          {ship.mine && pending.length > 0 && asYard ? (
            <ul className="mt-3 grid gap-2">
              {pending.map((entry) => {
                const person = personById(entry.personId);
                if (!person) return null;
                return (
                  <li key={entry.personId} className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2">
                    <button type="button" onClick={() => openPerson(person.id)} className="min-w-0 text-left text-sm">
                      <span className="font-medium">{person.name}</span>
                      <span className="text-mute"> · Ship {person.delivery}</span>
                    </button>
                    <span className="flex shrink-0 gap-2">
                      <Btn className="px-3 text-xs" onClick={() => acceptTester(ship.id, person.id)}>
                        Accept
                      </Btn>
                      <Btn variant="ghost" className="px-3 text-xs" onClick={() => declineTester(ship.id, person.id)}>
                        Drop
                      </Btn>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {accepted.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-medium tracking-widest text-dim">ON THIS TESTNET</p>
              <ul className="mt-2 grid gap-2">
                {accepted.map((entry) => {
                  const person = personById(entry.personId);
                  if (!person) return null;
                  return (
                    <li key={entry.personId}>
                      <button
                        type="button"
                        onClick={() => openPerson(person.id)}
                        className="flex w-full items-center gap-3 rounded-lg bg-card px-3 py-2 text-left"
                      >
                        <PersonMark name={person.id === "maya" ? "Maya" : person.name} />
                        <span className="min-w-0 text-sm">
                          <span className="font-medium">{person.name}</span>
                          <span className="block text-mute">On this testnet · not on the crew</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ShipCrewBlock({ ship }: { ship: YardShip }) {
  const saveCrew = useYard((state) => state.saveCrew);
  const openPerson = useYard((state) => state.openPerson);
  const bio = useYard((state) => state.profile.bio);
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ship.crew.name);
  const [picked, setPicked] = useState(ship.crew.members.filter((id) => id !== "maya"));
  const [error, setError] = useState("");
  if (!showInWindow(ship, "crew", asYard)) return null;

  return (
    <div className="mb-5 max-w-xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-widest text-dim">{ship.crew.name}</h3>
        {asYard ? (
          <Btn type="button" variant="ghost" className="px-3 text-xs" onClick={() => setEditing((open) => !open)}>
            {editing ? "Close" : "Edit crew"}
          </Btn>
        ) : null}
      </div>
      {asYard && editing ? (
        <form
          className="mb-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError("Name the crew.");
              return;
            }
            saveCrew(ship.id, { name, members: ["maya", ...picked] });
            setError("");
            setEditing(false);
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">CREW NAME</span>
            <input value={name} maxLength={32} onChange={(event) => setName(event.target.value)} className={field} />
          </label>
          <p className="text-sm text-mute">You stay on it. Add people you already know.</p>
          {(["kade", "rin"] as const).map((id) => {
            const person = personById(id);
            if (!person) return null;
            return (
              <label key={id} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.includes(id)}
                  onChange={() =>
                    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
                  }
                  className="size-4 accent-accent"
                />
                {person.name} · {person.role}
              </label>
            );
          })}
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Btn type="submit" className="px-3 text-xs">
            Save crew
          </Btn>
        </form>
      ) : null}
      <ul className="grid gap-2">
        {ship.crew.members.map((id) => {
          const person = personById(id);
          if (!person) return null;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => openPerson(person.id)}
                className="flex w-full items-center gap-3 rounded-lg bg-card px-3 py-2 text-left"
              >
                <PersonMark name={person.id === "maya" ? "Maya" : person.name} />
                <span className="min-w-0 text-sm">
                  <span className="font-medium">{person.name}</span>
                  <span className="text-mute"> · {person.role}</span>
                  {person.id === "maya" && bio ? <span className="mt-0.5 block truncate text-xs text-mute">{bio}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ShipRoleBlock({ ship }: { ship: YardShip }) {
  const saveRole = useYard((state) => state.saveRole);
  const applyRole = useYard((state) => state.applyRole);
  const acceptRole = useYard((state) => state.acceptRole);
  const declineRole = useYard((state) => state.declineRole);
  const openPerson = useYard((state) => state.openPerson);
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview && !ship.sunset;
  const [title, setTitle] = useState(ship.role?.title ?? "");
  const [brief, setBrief] = useState(ship.role?.brief ?? "");
  const [open, setOpen] = useState(ship.role?.open ?? true);
  const [error, setError] = useState("");
  const filled = ship.roleApps.find((entry) => entry.status === "accepted");
  const pending = ship.roleApps.filter((entry) => entry.status === "pending");
  if (!ship.role && !asYard) return null;

  return (
    <div className="mb-5 max-w-xl">
      <h3 className="text-xs font-medium tracking-widest text-dim">ROLE</h3>
      {ship.role ? (
        <p className="mt-2 text-sm">
          {ship.role.open ? "Open" : "Closed"} · {ship.role.title}
        </p>
      ) : (
        <p className="mt-2 text-sm text-mute">No role posted.</p>
      )}
      {ship.role ? <p className="mt-1 text-sm text-mute">{ship.role.brief}</p> : null}
      {filled ? (
        <p className="mt-2 text-sm">
          Filled by{" "}
          <button type="button" className="text-accent" onClick={() => openPerson(filled.personId)}>
            {personById(filled.personId)?.name}
          </button>
        </p>
      ) : null}
      {asYard ? (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim() || !brief.trim()) {
              setError("Name the role and say what you need.");
              return;
            }
            saveRole(ship.id, { title, brief, open });
            setError("");
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">TITLE</span>
            <input value={title} maxLength={48} onChange={(event) => setTitle(event.target.value)} className={field} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">WHAT YOU NEED</span>
            <input value={brief} maxLength={140} onChange={(event) => setBrief(event.target.value)} className={field} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={open} onChange={(event) => setOpen(event.target.checked)} className="size-4 accent-accent" />
            Open
          </label>
          {error ? <p className="text-sm text-bad">{error}</p> : null}
          <Btn type="submit" className="px-3 text-xs">
            Save role
          </Btn>
        </form>
      ) : null}
      {asYard && ship.role?.open
        ? pending.map((entry) => {
            const person = personById(entry.personId);
            if (!person) return null;
            return (
              <div key={entry.personId} className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className="text-sm font-medium" onClick={() => openPerson(person.id)}>
                  {person.name}
                </button>
                <Btn className="px-3 text-xs" onClick={() => acceptRole(ship.id, person.id)}>
                  Accept
                </Btn>
                <Btn variant="ghost" className="px-3 text-xs" onClick={() => declineRole(ship.id, person.id)}>
                  Drop
                </Btn>
              </div>
            );
          })
        : null}
      {!ship.mine && ship.role?.open ? (
        ship.crew.members.includes("maya") ? (
          <p className="mt-3 text-sm text-mute">You're already on this crew.</p>
        ) : ship.roleApps.some((entry) => entry.personId === "maya" && entry.status === "declined") ? (
          <p className="mt-3 text-sm text-mute">Declined.</p>
        ) : ship.roleApps.some((entry) => entry.personId === "maya") ? (
          <p className="mt-3 text-sm text-accent">Applied with your card.</p>
        ) : (
          <Btn className="mt-3 px-3 text-xs" onClick={() => applyRole(ship.id)}>
            Apply with your card
          </Btn>
        )
      ) : null}
    </div>
  );
}

function ShipIncidentBlock({ ship }: { ship: YardShip }) {
  const saveIncident = useYard((state) => state.saveIncident);
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview && !ship.sunset;
  const [text, setText] = useState(ship.incident?.text ?? "");
  const [open, setOpen] = useState(ship.incident?.open ?? true);
  if (!ship.incident && !asYard) return null;

  return (
    <div className="mb-5 max-w-xl">
      <h3 className="text-xs font-medium tracking-widest text-dim">INCIDENT</h3>
      {ship.incident ? (
        <p className="mt-2 text-sm">
          {ship.incident.open ? "Open" : "Closed"} · {ship.incident.text}
        </p>
      ) : (
        <p className="mt-2 text-sm text-mute">None disclosed.</p>
      )}
      {asYard ? (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveIncident(ship.id, { text, open });
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">WHAT HAPPENED</span>
            <input value={text} maxLength={160} onChange={(event) => setText(event.target.value)} className={field} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={open} onChange={(event) => setOpen(event.target.checked)} className="size-4 accent-accent" />
            Still open
          </label>
          <Btn type="submit" className="px-3 text-xs">
            {text.trim() ? "Disclose" : "Clear"}
          </Btn>
        </form>
      ) : null}
    </div>
  );
}

function ShipWork({ ship }: { ship: YardShip }) {
  const tasks = useYard((state) => state.tasks);
  const addWork = useYard((state) => state.addWork);
  const setYardTab = useYard((state) => state.setYardTab);
  const setNav = useYard((state) => state.setNav);
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview && !ship.sunset;
  const [title, setTitle] = useState("");
  const crew = ship.crew.members.map((id) => (id === "maya" ? "Maya" : personById(id)?.name || "")).filter(Boolean);
  const [who, setWho] = useState(crew[0] ?? "Maya");
  const open = COLUMN_ORDER.filter((key) => key !== "shipped").flatMap((key) =>
    tasks[key].filter((task) => task.shipId === ship.id).map((task) => ({ ...task, column: key })),
  );
  if (!asYard && open.length === 0) return null;

  return (
    <div className="mb-5 max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-widest text-dim">WORK</h3>
        <button
          type="button"
          className="text-xs text-accent"
          onClick={() => {
            setNav("yard");
            setYardTab("board");
          }}
        >
          Board
        </button>
      </div>
      {open.length === 0 ? (
        <p className="mt-2 text-sm text-mute">Nothing open on the board.</p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {open.map((task) => (
            <li key={task.id} className="rounded-lg bg-card px-3 py-2 text-sm">
              <span className="font-medium">{task.title}</span>
              <span className="text-mute">
                {" "}
                · {task.who} · {COLUMNS.find((column) => column.key === task.column)?.label}
              </span>
            </li>
          ))}
        </ul>
      )}
      {asYard ? (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            addWork(ship.id, { title, who });
            setTitle("");
          }}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">ADD TO ICEBOX</span>
            <input value={title} maxLength={48} onChange={(event) => setTitle(event.target.value)} className={field} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium tracking-widest text-dim">WHO</span>
            <select value={who} onChange={(event) => setWho(event.target.value)} className={field}>
              {crew.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <Btn type="submit" className="px-3 text-xs">
            Add
          </Btn>
        </form>
      ) : null}
    </div>
  );
}

function ShipNotes({ ship }: { ship: YardShip }) {
  const submitNote = useYard((state) => state.submitNote);
  const setNoteStatus = useYard((state) => state.setNoteStatus);
  const openPerson = useYard((state) => state.openPerson);
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const visible = ship.notes.filter((note) => note.status !== "dropped" && (asYard || note.status === "kept"));
  const sent = ship.notes.some((note) => note.personId === "maya" && note.status !== "dropped");

  if (ship.sunset && visible.length === 0) return null;
  if (!asYard && visible.length === 0 && ship.mine) return null;

  return (
    <div className="mb-5 max-w-xl">
      <h3 className="text-xs font-medium tracking-widest text-dim">SUGGESTIONS</h3>
      <p className="mt-1 text-sm text-mute">One note. The owner keeps or drops it. No thread.</p>
      {visible.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {visible.map((note) => {
            const person = personById(note.personId);
            if (!person) return null;
            return (
              <li key={note.id} className="rounded-lg bg-card px-3 py-2">
                <button type="button" onClick={() => openPerson(person.id)} className="text-left text-sm font-medium">
                  {person.name}
                </button>
                <p className="mt-1 text-sm">{note.text}</p>
                {asYard && note.status === "pending" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Btn className="px-3 text-xs" onClick={() => setNoteStatus(ship.id, note.id, "kept")}>
                      Keep
                    </Btn>
                    <Btn variant="ghost" className="px-3 text-xs" onClick={() => setNoteStatus(ship.id, note.id, "dropped")}>
                      Drop
                    </Btn>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {!ship.mine && !ship.sunset ? (
        sent ? (
          <p className="mt-3 text-sm text-accent">Sent. The owner keeps or drops it.</p>
        ) : (
          <form
            className="mt-3 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!text.trim()) {
                setError("Write the note.");
                return;
              }
              submitNote(ship.id, text);
              setText("");
              setError("");
            }}
          >
            <input
              value={text}
              maxLength={200}
              placeholder="One note for the owner"
              onChange={(event) => setText(event.target.value)}
              className={field}
            />
            {error ? <p className="text-sm text-bad">{error}</p> : null}
            <Btn type="submit" className="px-3 text-xs">
              Send note
            </Btn>
          </form>
        )
      ) : null}
    </div>
  );
}

function OtherShip({ ship, showBack }: { ship: YardShip; showBack?: boolean }) {
  const updateShip = useYard((state) => state.updateShip);
  const watches = useYard((state) => state.watches);
  const toggleWatch = useYard((state) => state.toggleWatch);
  const [editing, setEditing] = useState(false);
  const preview = useYard((state) => state.preview);
  const watching = watches.includes(ship.id);

  return (
    <div>
      {showBack ? <Back label="Watch" /> : null}
      <PreviewBar />
      <PageTitle
      title={ship.name}
      sub={
        ship.sunset
          ? "Sunset. Closed clean. Nothing left to edit."
          : ship.mine
            ? "Your ship. Still private until you publish a window."
            : "Prior ship. Read only."
      }
    />
      <Panel className="max-w-xl">
        {ship.mine && editing && !preview ? (
          <ShipFields
            initial={ship}
            submitLabel="Save ship"
            onCancel={() => setEditing(false)}
            onSubmit={(value) => {
              updateShip(ship.id, value);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <p className="text-sm text-mute">
              {ship.chain}
              {ship.line ? ` · ${ship.line}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ship.mine && !preview ? (
                <Btn variant="outline" className="px-3 text-xs" onClick={() => setEditing(true)}>
                  Edit ship
                </Btn>
              ) : null}
              <Btn variant="ghost" className="px-3 text-xs" onClick={() => toggleWatch(ship.id)}>
                {watching ? "Watching" : "Watch"}
              </Btn>
            </div>
          </>
        )}
      </Panel>
      <ShipCrewBlock key={`${ship.id}-crew`} ship={ship} />
      <ShipRoleBlock key={`${ship.id}-role`} ship={ship} />
      <ShipIncidentBlock key={`${ship.id}-incident`} ship={ship} />
      <ShipWork key={`${ship.id}-work`} ship={ship} />
      <ShipStagePanel key={ship.id} ship={ship} />
      <ShipContracts ship={ship} />
      <ShipRecord ship={ship} />
      <ShipNotes ship={ship} />
    </div>
  );
}

export function ShipScreen({ showBack }: { showBack?: boolean }) {
  const published = useYard((state) => state.published);
  const profile = useYard((state) => state.profile);
  const shipId = useYard((state) => state.shipId);
  const ships = useYard((state) => state.ships);
  const updateShip = useYard((state) => state.updateShip);
  const ship = ships.find((item) => item.id === shipId) ?? ships.find((item) => item.id === "vault-v2");
  const [editing, setEditing] = useState(false);
  const preview = useYard((state) => state.preview);
  const href = profileHref(profile.link);

  if (ship && ship.id !== "vault-v2") return <OtherShip ship={ship} showBack={showBack} />;

  return (
    <div>
      {showBack ? <Back label="Feed" /> : null}
      <PreviewBar />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <PageTitle
          title={ship?.name ?? "vault-v2"}
          sub={`${ship?.chain ?? "Base"} · ${ship ? shipStageLabel(ship) : "Audit"}${published && ship?.stage === "Alive" && !ship.sunset ? " · just now" : ""}`}
        />
        {ship?.mine && !editing && !preview ? (
          <Btn variant="outline" className="mb-4 px-3 text-xs" onClick={() => setEditing(true)}>
            Edit ship
          </Btn>
        ) : null}
      </div>
      {ship?.mine && editing && !preview ? (
        <Panel className="mb-5 max-w-xl">
          <ShipFields
            initial={ship}
            submitLabel="Save ship"
            onCancel={() => setEditing(false)}
            onSubmit={(value) => {
              updateShip(ship.id, value);
              setEditing(false);
            }}
          />
        </Panel>
      ) : ship?.line ? (
        <p className="mb-4 text-sm text-mute">{ship.line}</p>
      ) : null}
      <div className="mb-5 flex items-center gap-3">
        <PersonMark name="0xMaya" className="size-10" />
        <div className="min-w-0">
          <p className="text-sm font-medium">0xMaya</p>
          {profile.bio ? <p className="truncate text-sm text-mute">{profile.bio}</p> : null}
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-sm text-accent">
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{profile.link.trim()}</span>
            </a>
          ) : null}
        </div>
      </div>
      {ship ? (
        <>
          <ShipCrewBlock key={`${ship.id}-crew`} ship={ship} />
          <ShipRoleBlock key={`${ship.id}-role`} ship={ship} />
      <ShipIncidentBlock key={`${ship.id}-incident`} ship={ship} />
      <ShipWork key={`${ship.id}-work`} ship={ship} />
        </>
      ) : null}
      {ship ? <ShipStagePanel key={ship.id} ship={ship} /> : null}
      {ship ? <ShipNotes ship={ship} /> : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {ship && showInWindow(ship, "proof", ship.mine && !preview) ? <ShipContracts ship={ship} /> : null}
        <div className="grid gap-3">
          {ship ? <ShipRecord ship={ship} /> : (
            <Panel>
              <p className="text-sm text-mute">Window is quiet until you publish.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export function BuilderCard() {
  const profile = useYard((state) => state.profile);
  const ships = useYard((state) => state.ships);
  const openLog = useYard((state) => state.openLog);
  const updateProfile = useYard((state) => state.updateProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);
  const [error, setError] = useState("");
  const shown = editing ? draft : profile;
  const href = profileHref(shown.link);

  function beginEdit() {
    setDraft(profile);
    setError("");
    setEditing(true);
  }

  async function pickImage(kind: "avatar" | "banner", file: File | undefined) {
    if (!file) return;
    try {
      const url = await readProfileImage(file, kind === "banner" ? 1200 : 512, kind === "banner" ? 480 : 512);
      setDraft((current) => ({ ...current, [kind]: url }));
      setError("");
    } catch {
      setError("Use a PNG, JPEG, or WebP.");
    }
  }

  function save() {
    updateProfile(draft);
    setEditing(false);
    setError("");
  }

  const onCard = ships.filter((ship) => ship.mine || ship.crew.members.includes("maya"));
  const deployRows = onCard.filter((ship) => ship.proofs.some((row) => row.kind === "Deploy")).length;
  const sunsets = onCard.filter((ship) => ship.sunset).length;

  return (
    <div>
      <p className="mb-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-mute">
        {onCard.length} {onCard.length === 1 ? "ship" : "ships"} on this card. {deployRows}{" "}
        {deployRows === 1 ? "deploy row" : "deploy rows"}. {sunsets} sunset.
      </p>
      <article className="max-w-xl overflow-hidden rounded-card border border-line bg-surface">
        <div className="relative z-0 h-36 overflow-hidden bg-bg">
          {shown.banner ? (
            <img src={shown.banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="yard-grid h-full" />
          )}
          {editing ? (
            <div className="absolute right-3 top-3 flex gap-2">
              <ImagePick label={shown.banner ? "Change banner" : "Add banner"} onFile={(file) => pickImage("banner", file)} />
              {shown.banner ? (
                <button
                  type="button"
                  className="rounded-lg bg-bg/80 px-3 py-2 text-xs font-semibold text-ink"
                  onClick={() => setDraft((current) => ({ ...current, banner: "" }))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between gap-3">
            <div className="relative z-10 -mt-10 shrink-0">
              {editing ? (
                <label className="group relative block cursor-pointer">
                  <Avatar src={shown.avatar} />
                  <span className="absolute inset-0 grid place-items-center rounded-full bg-bg/70 text-xs font-semibold text-ink opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                    Photo
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void pickImage("avatar", event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              ) : (
                <Avatar src={shown.avatar} />
              )}
            </div>
            {editing ? (
              shown.avatar ? (
                <button
                  type="button"
                  className="mb-1 text-xs text-mute hover:text-ink"
                  onClick={() => setDraft((current) => ({ ...current, avatar: "" }))}
                >
                  Remove photo
                </button>
              ) : null
            ) : (
              <div className="flex flex-wrap gap-2">
              <Btn variant="outline" className="mb-1 px-3 text-xs" onClick={beginEdit}>
                Edit profile
              </Btn>
              <Btn variant="ghost" className="mb-1 px-3 text-xs" onClick={openLog}>
                Log
              </Btn>
            </div>
            )}
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">0xMaya</h2>
              <p className="text-sm text-mute">maya-eth</p>
            </div>
            <span className="rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-crew">OPEN TO CREW</span>
          </div>
          {editing ? (
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">BIO</span>
                <textarea
                  value={draft.bio}
                  maxLength={BIO_MAX}
                  rows={3}
                  onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                  className="resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none"
                />
                <span className="text-right font-mono text-xs text-dim tabular-nums">
                  {draft.bio.length}/{BIO_MAX}
                </span>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium tracking-widest text-dim">LINK</span>
                <input
                  value={draft.link}
                  maxLength={200}
                  placeholder="https://…"
                  onChange={(event) => setDraft((current) => ({ ...current, link: event.target.value }))}
                  className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none placeholder:text-dim"
                />
              </label>
              {error ? <p className="text-sm text-bad">{error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Btn className="px-3 text-xs" onClick={save}>
                  Save
                </Btn>
                <Btn
                  variant="ghost"
                  className="px-3 text-xs"
                  onClick={() => {
                    setEditing(false);
                    setError("");
                  }}
                >
                  Cancel
                </Btn>
              </div>
            </div>
          ) : (
            <>
              {shown.bio ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{shown.bio}</p> : null}
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent">
                  <ArrowUpRight className="size-3.5" aria-hidden />
                  <span className="break-all">{shown.link.trim()}</span>
                </a>
              ) : null}
            </>
          )}
          <p className="mt-3 text-sm text-mute">Solidity · Harbor crew · Base / ETH</p>
          <ScoreBars />
          <ShipLinks personId="maya" />
        </div>
      </article>
    </div>
  );
}

function Avatar({ src }: { src: string }) {
  if (src) {
    return <img src={src} alt="0xMaya" className="size-20 rounded-full border-4 border-surface object-cover" />;
  }
  return (
    <span className="grid size-20 place-items-center rounded-full border-4 border-surface bg-accent-dim font-mono text-2xl text-accent">
      M
    </span>
  );
}

function ImagePick({ label, onFile }: { label: string; onFile: (file: File | undefined) => void }) {
  return (
    <label className="cursor-pointer rounded-lg bg-bg/80 px-3 py-2 text-xs font-semibold text-ink">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function ShipContracts({ ship }: { ship: YardShip }) {
  const preview = useYard((state) => state.preview);
  const asYard = ship.mine && !preview;
  if (!showInWindow(ship, "proof", asYard)) return null;
  const deploys = ship.proofs.filter((row) => row.kind === "Deploy");
  return (
    <Panel>
      <h3 className="text-xs font-medium tracking-widest text-accent">CONTRACTS</h3>
      {deploys.length === 0 ? (
        <p className="mt-3 text-sm text-mute">No deploy pinned.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {deploys.map((row) => (
            <li key={row.text} className="font-mono text-xs text-mute">
              {row.text}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ShipRecord({ ship }: { ship: YardShip }) {
  const ships = useYard((state) => state.ships);
  const published = useYard((state) => state.published);
  const events = [incidentEvent(ship), roleEvent(ship), ...shipEvents(ships, published).filter((event) => event.shipId === ship.id)].filter(
    (event) => event != null,
  );
  if (events.length === 0) {
    return (
      <Panel>
        <p className="text-sm text-mute">No event for this ship yet.</p>
      </Panel>
    );
  }
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <EventCard key={event.id} id={event.id} />
      ))}
    </div>
  );
}

function shipPlace(ship: YardShip, tasks: Record<ColKey, { id: string }[]>) {
  if (ship.sunset) return { group: "sunset" as const, label: "Sunset" };
  if (ship.stage === "Alive" || ship.stage === "Mainnet") return { group: "shipped" as const, label: ship.stage };
  const column = COLUMN_ORDER.find((key) => tasks[key].some((task) => task.id === ship.id));
  if (column === "shipped") return { group: "shipped" as const, label: "Shipped" };
  if (ship.stage === "Testnet" || ship.stage === "Audit") return { group: "yard" as const, label: ship.stage };
  if (column === "now") return { group: "yard" as const, label: "Now" };
  if (column === "review") return { group: "yard" as const, label: "Review" };
  if (ship.id === "vault-v2") return { group: "yard" as const, label: ship.stage };
  return { group: "yard" as const, label: column === "icebox" ? "Icebox" : ship.stage };
}

function ShipLinks({ personId }: { personId: "maya" | "kade" | "rin" }) {
  const ships = useYard((state) => state.ships);
  const tasks = useYard((state) => state.tasks);
  const openShip = useYard((state) => state.openShip);
  const person = personById(personId);
  const ids = new Set(person?.ships ?? []);
  if (personId === "maya") {
    for (const ship of ships) if (ship.mine) ids.add(ship.id);
  }
  const rows = ships
    .filter((ship) => ids.has(ship.id))
    .map((ship) => ({ ship, ...shipPlace(ship, tasks) }));
  const groups = [
    ["yard", "IN THE YARD"],
    ["shipped", "SHIPPED"],
    ["sunset", "SUNSET"],
  ] as const;
  const onRecord = rows.filter((row) => row.group !== "sunset").length;
  const sunset = rows.filter((row) => row.group === "sunset").length;

  return (
    <div>
      {groups.map(([key, label]) => {
        const list = rows.filter((row) => row.group === key);
        if (list.length === 0) return null;
        return (
          <div key={key} className="mt-4">
            <p className="text-xs font-medium tracking-widest text-dim">{label}</p>
            <ul className="mt-1 grid">
              {list.map((row) => (
                <li key={row.ship.id}>
                  <button
                    type="button"
                    onClick={() => openShip(row.ship.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-card"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{row.ship.name}</span>
                      <span className="block truncate text-xs text-mute">{row.ship.chain}</span>
                    </span>
                    <span className="shrink-0 text-xs text-accent">{row.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="mt-3 text-sm text-accent">
        {onRecord} on the record · {sunset} sunset
      </p>
    </div>
  );
}

function ReadOnlyCard({ personId }: { personId: "kade" | "rin" }) {
  const person = personById(personId);
  if (!person) return null;
  return (
    <article className="max-w-xl overflow-hidden rounded-card border border-line bg-surface">
      <div className="yard-grid h-36" />
      <div className="px-4 pb-4">
        <div className="relative z-10 -mt-10">
          <span className="grid size-20 place-items-center rounded-full border-4 border-surface bg-accent-dim font-mono text-2xl text-accent">
            {person.initial}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold">{person.name}</h2>
        <p className="text-sm text-mute">{person.handle}</p>
        <p className="mt-3 text-sm leading-relaxed">{person.bio}</p>
        <p className="mt-3 text-sm text-mute">{person.focus}</p>
        <ScoreBars scores={person.scores} />
        <ShipLinks personId={person.id} />
      </div>
    </article>
  );
}

export function PeopleScreen({ showBack }: { showBack?: boolean }) {
  const personId = useYard((state) => state.personId);
  const openPerson = useYard((state) => state.openPerson);
  const closePerson = useYard((state) => state.closePerson);
  const directory = [...PEOPLE].sort((a, b) => b.delivery - a.delivery);

  if (!personId) {
    return (
      <div>
        <PageTitle title="People" sub="Sorted by delivery, not followers." />
        <div className="grid max-w-xl gap-2">
          {directory.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => openPerson(person.id)}
              className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left"
            >
              <PersonMark name={person.id === "maya" ? "Maya" : person.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{person.name}</span>
                <span className="block text-sm text-mute">
                  {person.role} · Ship {person.delivery}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {showBack ? (
        <Back label="Crew" />
      ) : (
        <button type="button" onClick={closePerson} className="mb-3 inline-flex items-center gap-1 text-sm text-accent">
          <ArrowLeft className="size-4" aria-hidden />
          People
        </button>
      )}
      {personId === "maya" ? <BuilderCard /> : <ReadOnlyCard personId={personId} />}
    </div>
  );
}

export function LaunchScreen() {
  const ships = useYard((state) => state.ships);
  const openShip = useYard((state) => state.openShip);
  const published = useYard((state) => state.published);
  const collects = useYard((state) => state.collects);
  const collect = useYard((state) => state.collect);
  const known = [
    ...ships.map(incidentEvent).filter((event) => event != null),
    ...ships.map(roleEvent).filter((event) => event != null),
    ...shipEvents(ships, published),
  ];
  const marks = collects.map((id) => known.find((event) => event.id === id) ?? null);
  const collected = collects.includes("e-deploy");
  const open = ships.filter((ship) => !ship.sunset && windowLive(ship.stage));
  return (
    <div>
      <PageTitle title="Launch" sub="Ships that opened a window. Nothing tradable." />
      <ul className="mb-4 grid max-w-xl gap-2">
        {open.length === 0 ? (
          <li className="rounded-card border border-line bg-surface p-4 text-sm text-mute">No public window yet.</li>
        ) : (
          open.map((ship) => (
            <li key={ship.id}>
              <button
                type="button"
                onClick={() => openShip(ship.id)}
                className="w-full rounded-card border border-line bg-surface p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{ship.name}</h3>
                  <span className="text-xs text-accent">{ship.stage}</span>
                </div>
                <p className="mt-1 text-sm text-mute">
                  {ship.crew.name} · {ship.chain}
                </p>
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="mb-4 max-w-xl">
        <h3 className="text-xs font-medium tracking-widest text-dim">COLLECTED</h3>
        {marks.length === 0 ? (
          <p className="mt-2 text-sm text-mute">Nothing collected. A collect is a mark on a ship event, not a like.</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {marks.map((event, index) =>
              event ? (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => openShip(event.shipId)}
                    className="w-full rounded-lg bg-card px-3 py-2 text-left"
                  >
                    <span className="text-xs text-accent">{event.verb}</span>
                    <span className="mt-1 block text-sm font-medium">{event.title}</span>
                  </button>
                </li>
              ) : (
                <li key={collects[index]} className="rounded-lg bg-card px-3 py-2 text-sm text-mute">
                  That mark left the feed.
                </li>
              ),
            )}
          </ul>
        )}
      </div>
      <Panel className="max-w-xl">
        <h3 className="text-lg font-semibold">vault-v2 genesis</h3>
        <p className="mt-1 text-sm text-mute">
          {published ? "Open — proof of presence for this deploy." : "Opens when the deploy is published."}
        </p>
        <ProofRow proof={ships.find((ship) => ship.id === "vault-v2")?.proofs.find((row) => row.kind === "Deploy")?.text || "No deploy pinned."} />
        <Btn className="mt-3 px-3 py-2 text-xs" disabled={!published} onClick={() => collect("e-deploy")}>
          {collected ? "Collected" : "Collect"}
        </Btn>
      </Panel>
    </div>
  );
}

export function DiligenceScreen({ showBack }: { showBack?: boolean }) {
  const ships = useYard((state) => state.ships);
  const shipId = useYard((state) => state.shipId);
  const focusShip = useYard((state) => state.focusShip);
  const openShip = useYard((state) => state.openShip);
  const preview = useYard((state) => state.preview);
  const ship = ships.find((item) => item.id === shipId) ?? ships[0];
  if (!ship) return null;
  const sunset = ship.sunset;
  const stage = sunset ? "Sunset" : ship.stage;
  const crew = ship.crew.members
    .map((id) => personById(id))
    .filter((person) => person != null)
    .map((person) => `${person.name} · Ship ${person.delivery}`)
    .join("\n");
  const keptNotes = ship.notes.filter((note) => note.status === "kept");
  const keptIdeas = ship.ideas?.ideas.filter((idea) => idea.status === "kept") ?? [];
  const kept = [
    ...keptIdeas.map((idea) => idea.text),
    ...keptNotes.map((note) => note.text),
  ];
  const accepted = ship.applications.filter((entry) => entry.status === "accepted");
  const others = ships.filter((item) => item.id !== ship.id);

  return (
    <div>
      {showBack ? <Back label="Feed" /> : null}
      <PageTitle title={`Diligence · ${ship.name}`} sub="Living one-pager. Only facts already on the ship." />
      <div className="mb-4 flex flex-wrap gap-2">
        {ships.map((item) => (
          <Btn
            key={item.id}
            type="button"
            variant={item.id === ship.id ? "primary" : "ghost"}
            className="px-3 text-xs"
            onClick={() => focusShip(item.id)}
          >
            {item.name}
          </Btn>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">STAGE</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            {ship.chain} · {stage}
            {sunset ? ". Closed clean." : windowLive(ship.stage) ? ". Window open." : ". Window closed."}
          </p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">{ship.crew.name.toUpperCase()}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mute">{crew || "No one on this crew."}</p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">PROOF</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mute">
            {showInWindow(ship, "proof", ship.mine && !preview)
              ? ship.proofs.length
                ? ship.proofs.map((row) => `${row.kind} · ${row.text}`).join("\n")
                : "No proof pinned yet."
              : "Proof stays in the yard."}
          </p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">KEPT</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            {kept.length ? kept.join(" ") : "Nothing kept yet. Ideas and suggestions stay off this page until you keep them."}
          </p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">INCIDENT</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            {ship.incident ? `${ship.incident.open ? "Open" : "Closed"} · ${ship.incident.text}` : "None disclosed."}
          </p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">TESTNET</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            {ship.seats
              ? `${ship.seats.count} seats. ${ship.seats.brief}`
              : "No seats opened."}
            {accepted.length
              ? ` On it: ${accepted
                  .map((entry) => personById(entry.personId)?.name)
                  .filter(Boolean)
                  .join(", ")}.`
              : ""}
          </p>
        </Panel>
        <Panel>
          <h3 className="text-xs font-medium tracking-widest text-accent">OTHER SHIPS</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            {others.length
              ? others
                  .map((item) => `${item.name} · ${item.sunset ? "Sunset" : item.stage}`)
                  .join(". ")
              : "No other ships."}
          </p>
        </Panel>
      </div>
      <Btn type="button" variant="ghost" className="mt-4 px-3 text-xs" onClick={() => openShip(ship.id)}>
        Open {ship.name}
      </Btn>
    </div>
  );
}

export function MessagesScreen({ showBack }: { showBack?: boolean }) {
  const log = useYard((state) => state.log);
  const setNav = useYard((state) => state.setNav);
  const setPhoneTab = useYard((state) => state.setPhoneTab);
  return (
    <div>
      {showBack ? (
        <button
          type="button"
          onClick={() => {
            setPhoneTab("card");
            setNav("me");
          }}
          className="mb-3 inline-flex items-center gap-1 text-sm text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Card
        </button>
      ) : null}
      <PageTitle title="Log" sub="Private record of what you decided. Not a chat." />
      {log.length === 0 ? (
        <Panel>
          <p className="text-sm text-mute">Nothing recorded yet.</p>
        </Panel>
      ) : (
        <ul className="grid max-w-xl gap-2">
          {log.map((entry) => (
            <li key={entry.id} className="rounded-card border border-line bg-surface px-4 py-3 text-sm">
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WatchScreen() {
  return (
    <div>
      <PageTitle title="Watch" sub="Home only shows ships you watch. Stage dots, not repo trees." />
      <NewShip />
      <WatchList />
    </div>
  );
}

function WatchList({ compact }: { compact?: boolean }) {
  const ships = useYard((state) => state.ships);
  const watches = useYard((state) => state.watches);
  const toggleWatch = useYard((state) => state.toggleWatch);
  const openShip = useYard((state) => state.openShip);
  const watching = ships.filter((ship) => watches.includes(ship.id));
  const rest = ships.filter((ship) => !watches.includes(ship.id));
  const groups = [
    ["watching", "WATCHING", watching],
    ["rest", "NOT WATCHING", rest],
  ] as const;

  return (
    <div className="grid gap-4">
      {groups.map(([key, label, list]) => (
        <section key={key}>
          {compact && key === "watching" ? null : (
            <h3 className={cn("text-xs font-medium tracking-widest text-dim", compact && "mt-3")}>{label}</h3>
          )}
          {list.length === 0 ? (
            key === "watching" ? (
              <p className="mt-2 text-sm text-mute">You're not watching a ship.</p>
            ) : compact ? null : (
              <p className="mt-2 text-sm text-mute">Every ship is on your list.</p>
            )
          ) : (
            <ul className={cn("grid gap-2", compact ? "mt-2" : "mt-2")}>
              {list.map((ship) => {
                const on = watches.includes(ship.id);
                const index = STAGES.indexOf(ship.stage);
                return (
                  <li key={ship.id} className={cn(!compact && "rounded-card border border-line bg-surface p-4")}>
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => openShip(ship.id)} className="min-h-11 min-w-0 text-left">
                        <span className={cn("block font-medium", compact ? "text-sm" : "font-semibold")}>{ship.name}</span>
                        {compact ? null : (
                          <span className="mt-1 block text-sm text-mute">
                            {ship.crew.name} · {ship.chain}
                            {ship.line ? ` · ${ship.line}` : ""}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWatch(ship.id)}
                        className="grid min-h-11 shrink-0 place-items-center rounded-md px-3 text-xs text-accent"
                      >
                        {on ? "Watching" : "Watch"}
                      </button>
                    </div>
                    {compact || ship.sunset ? null : (
                      <p className="mt-3 font-mono text-xs tracking-widest text-accent" aria-hidden>
                        {STAGES.map((_, dot) => (dot <= index ? "●" : "○")).join(" ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export function CrewScreen() {
  const ships = useYard((state) => state.ships);
  const bio = useYard((state) => state.profile.bio);
  const openPerson = useYard((state) => state.openPerson);
  const openShip = useYard((state) => state.openShip);

  return (
    <div>
      <PageTitle title="Crews" sub="Each ship has its own crew. Harbor is the yard, not a roster." />
      <ul className="grid max-w-xl gap-3">
        {ships.map((ship) => (
          <li key={ship.id} className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{ship.crew.name}</h3>
                <p className="mt-0.5 text-sm text-mute">
                  {ship.name} · {ship.sunset ? "Sunset" : ship.stage}
                </p>
              </div>
              <Btn type="button" variant="ghost" className="shrink-0 px-3 text-xs" onClick={() => openShip(ship.id)}>
                Open
              </Btn>
            </div>
            <ul className="mt-3 grid gap-2">
              {ship.crew.members.map((id) => {
                const person = personById(id);
                if (!person) return null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => openPerson(person.id)}
                      className="flex w-full items-center gap-3 rounded-lg bg-card px-3 py-2 text-left"
                    >
                      <PersonMark name={person.id === "maya" ? "Maya" : person.name} />
                      <span className="min-w-0 text-sm">
                        <span className="font-medium">{person.name}</span>
                        <span className="text-mute"> · {person.role}</span>
                        {person.id === "maya" && bio ? (
                          <span className="mt-0.5 block truncate text-xs text-mute">{bio}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeskBody() {
  const nav = useYard((state) => state.nav);
  if (nav === "home") return <Feed sidebar />;
  if (nav === "yard") return <YardScreen />;
  if (nav === "ships") return <ShipScreen />;
  if (nav === "people" || nav === "me") return nav === "me" ? <BuilderCard /> : <PeopleScreen />;
  if (nav === "launch") return <LaunchScreen />;
  if (nav === "diligence") return <DiligenceScreen />;
  return <MessagesScreen />;
}

export function PhoneBody() {
  const tab = useYard((state) => state.phoneTab);
  const sheet = useYard((state) => state.sheet);
  if (sheet === "ship") return <ShipScreen showBack />;
  if (sheet === "diligence") return <DiligenceScreen showBack />;
  if (sheet === "person") return <PeopleScreen showBack />;
  if (sheet === "log") return <MessagesScreen showBack />;
  if (tab === "feed") return <Feed />;
  if (tab === "watch") return <WatchScreen />;
  if (tab === "launch") return <LaunchScreen />;
  if (tab === "crew") return <CrewScreen />;
  return <BuilderCard />;
}
