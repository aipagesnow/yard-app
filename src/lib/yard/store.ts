import { create } from "zustand";
import {
  cleanProfile,
  DEFAULT_PROFILE,
  seedShips,
  seedTasks,
  STAGES,
  DEFAULT_WINDOW,
  PROOF_KINDS,
  windowLive,
  type ShipProof,
  type ColKey,
  type DeskView,
  type FeedFilter,
  type PersonId,
  type PhoneTab,
  type Profile,
  type Sheet,
  type ShipApplication,
  type ShipIdea,
  type ShipSeats,
  type ShipStage,
  type IdeaAccess,
  type IdeaRoom,
  type IdeaSection,
  type ShipCrew,
  type ShipNote,
  type ShipRole,
  type ShipIncident,
  type RoleApplication,
  type ShipWindow,
  type Task,
  type YardShip,
  type YardTab,
} from "@/lib/yard/data";

const STORAGE_KEY = "yard.v1";

type YardLog = { id: string; text: string };

function pushLog(log: YardLog[], text: string): YardLog[] {
  return [{ id: `l-${Date.now().toString(36)}`, text: text.slice(0, 160) }, ...log].slice(0, 40);
}

function cleanLog(raw: unknown, ships: YardShip[]): YardLog[] {
  const seeded = ships.flatMap((ship) =>
    ship.mine
      ? ship.notes
          .filter((note) => note.status === "pending")
          .map((note) => ({
            id: `s-${note.id}`,
            text: `${note.personId === "kade" ? "Kade" : note.personId === "rin" ? "Rin" : "You"} left a suggestion on ${ship.name}.`,
          }))
      : [],
  );
  if (!Array.isArray(raw)) return seeded;
  const log: YardLog[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const id = cleanShipText((item as YardLog).id, 24);
    const text = cleanShipText((item as YardLog).text, 160);
    if (!/^[a-z0-9-]+$/i.test(id) || !text) continue;
    log.push({ id, text });
    if (log.length === 40) break;
  }
  return log.length ? log : seeded;
}

export type Persisted = {
  signedIn: boolean;
  unpublished: boolean;
  published: boolean;
  watches: string[];
  collects: string[];
  tasks: Record<ColKey, Task[]>;
  nav: DeskView;
  phoneTab: PhoneTab;
  yardTab: YardTab;
  filter: FeedFilter;
  sheet: Sheet;
  profile: Profile;
  ships: YardShip[];
  shipId: string;
  personId: PersonId | null;
  log: YardLog[];
};

type YardState = Persisted & {
  hydrated: boolean;
  preview: boolean;
  toast: string | null;
  modal: null | "publish";
  hydrate: () => void;
  signIn: () => void;
  dismissToast: () => void;
  openPublish: () => void;
  cancelModal: () => void;
  publish: () => void;
  moveTask: (id: string, from: ColKey, to: ColKey) => void;
  addWork: (id: string, input: { title: string; who: string }) => void;
  toggleWatch: (shipId: string) => void;
  collect: (id: string) => void;
  setNav: (nav: DeskView) => void;
  setPhoneTab: (tab: PhoneTab) => void;
  setYardTab: (tab: YardTab) => void;
  setFilter: (filter: FeedFilter) => void;
  openShip: (id?: string) => void;
  focusShip: (id: string) => void;
  openDiligence: () => void;
  openLog: () => void;
  closeSheet: () => void;
  updateProfile: (profile: Profile) => void;
  createShip: (input: { name: string; chain: string; line: string }) => void;
  updateShip: (id: string, input: { name: string; chain: string; line: string }) => void;
  openPerson: (id: string) => void;
  closePerson: () => void;
  stepStage: (id: string, direction: -1 | 1) => void;
  setSunset: (id: string, on: boolean) => void;
  release: (id: string) => void;
  saveSeats: (id: string, input: { count: number; brief: string; link: string }) => void;
  saveProof: (id: string, rows: { kind: ShipProof["kind"]; text: string }[]) => void;
  applySeat: (id: string) => void;
  acceptTester: (id: string, personId: PersonId) => void;
  declineTester: (id: string, personId: PersonId) => void;
  saveIdeaRoom: (
    id: string,
    input: { access: IdeaAccess; links: boolean; votes: boolean; sections: { id: string; name: string; prompt: string }[] },
  ) => void;
  setIdeaStatus: (id: string, ideaId: string, status: "kept" | "dropped") => void;
  voteIdea: (id: string, ideaId: string) => void;
  submitIdea: (id: string, sectionId: string, text: string, link: string) => void;
  saveCrew: (id: string, input: { name: string; members: PersonId[] }) => void;
  saveWindow: (id: string, input: ShipWindow) => void;
  setPreview: (on: boolean) => void;
  submitNote: (id: string, text: string) => void;
  setNoteStatus: (id: string, noteId: string, status: "kept" | "dropped") => void;
  saveRole: (id: string, input: { title: string; brief: string; open: boolean }) => void;
  saveIncident: (id: string, input: { text: string; open: boolean }) => void;
  applyRole: (id: string) => void;
  acceptRole: (id: string, personId: PersonId) => void;
  declineRole: (id: string, personId: PersonId) => void;
};

function fresh(): Persisted {
  return {
    signedIn: false,
    unpublished: true,
    published: false,
    watches: ["vault-v2"],
    collects: [],
    tasks: seedTasks(),
    nav: "yard",
    phoneTab: "feed",
    yardTab: "board",
    filter: "watched",
    sheet: null,
    profile: DEFAULT_PROFILE,
    ships: seedShips(),
    shipId: "vault-v2",
    personId: null,
    log: cleanLog(undefined, seedShips()),
  };
}

function cleanShipText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanProofs(raw: unknown, fallback: string): ShipProof[] {
  if (Array.isArray(raw)) {
    const proofs: ShipProof[] = [];
    for (const kind of PROOF_KINDS) {
      const item = raw.find((row) => row && typeof row === "object" && (row as ShipProof).kind === kind);
      const text = item ? cleanShipText((item as ShipProof).text, 160) : "";
      if (text) proofs.push({ kind, text });
    }
    return proofs;
  }
  const text = cleanShipText(fallback, 160);
  return text ? [{ kind: "Audit", text }] : [];
}

function proofSummary(proofs: ShipProof[]) {
  return proofs.find((row) => row.kind === "Audit")?.text || proofs[0]?.text || "";
}

function isStage(value: unknown): value is ShipStage {
  return STAGES.includes(value as ShipStage);
}

function cleanSeats(raw: unknown): ShipSeats | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ShipSeats>;
  const count = typeof data.count === "number" ? Math.round(data.count) : 0;
  const brief = cleanShipText(data.brief, 140);
  if (count < 1 || count > 12 || !brief) return null;
  return { count, brief, link: cleanShipText(data.link, 200) };
}

function cleanApplications(raw: unknown): ShipApplication[] {
  if (!Array.isArray(raw)) return [];
  const applications: ShipApplication[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const personId = (item as ShipApplication).personId;
    const status = (item as ShipApplication).status;
    if (personId !== "maya" && personId !== "kade" && personId !== "rin") continue;
    if (status !== "pending" && status !== "accepted" && status !== "declined") continue;
    if (applications.some((entry) => entry.personId === personId)) continue;
    applications.push({ personId, status });
  }
  return applications.slice(0, 12);
}

function isPerson(value: unknown): value is PersonId {
  return value === "maya" || value === "kade" || value === "rin";
}

function cleanIdeaRoom(raw: unknown): IdeaRoom | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<IdeaRoom>;
  const access = data.access === "open" || data.access === "crew" || data.access === "closed" ? data.access : null;
  if (!access || !Array.isArray(data.sections)) return null;
  const sections: IdeaSection[] = [];
  for (const item of data.sections) {
    if (!item || typeof item !== "object") continue;
    const id = cleanShipText((item as IdeaSection).id, 20);
    const name = cleanShipText((item as IdeaSection).name, 32);
    const prompt = cleanShipText((item as IdeaSection).prompt, 80);
    if (!/^[a-z0-9-]+$/i.test(id) || !name || !prompt) continue;
    if (sections.some((section) => section.id === id)) continue;
    sections.push({ id, name, prompt });
    if (sections.length === 3) break;
  }
  if (!sections.length) return null;
  const ideas: ShipIdea[] = [];
  if (Array.isArray(data.ideas)) {
    for (const item of data.ideas) {
      if (!item || typeof item !== "object") continue;
      const idea = item as ShipIdea;
      const id = cleanShipText(idea.id, 24);
      const sectionId = cleanShipText(idea.sectionId, 20);
      if (!/^[a-z0-9-]+$/i.test(id) || !sections.some((section) => section.id === sectionId)) continue;
      if (!isPerson(idea.personId)) continue;
      if (idea.status !== "pending" && idea.status !== "kept" && idea.status !== "dropped") continue;
      const text = cleanShipText(idea.text, 280);
      if (!text) continue;
      if (ideas.some((entry) => entry.id === id)) continue;
      const votes = Array.isArray(idea.votes)
        ? idea.votes.filter(isPerson).filter((vote, index, list) => list.indexOf(vote) === index && vote !== idea.personId)
        : [];
      ideas.push({
        id,
        sectionId,
        personId: idea.personId,
        text,
        link: data.links === true ? cleanShipText(idea.link, 200) : "",
        status: idea.status,
        votes: idea.status === "kept" && data.votes === true ? votes.slice(0, 3) : [],
      });
      if (ideas.length === 24) break;
    }
  }
  return { access, links: data.links === true, votes: data.votes === true, sections, ideas };
}

function cleanCrew(raw: unknown, fallback: ShipCrew): ShipCrew {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<ShipCrew>;
  const name = cleanShipText(data.name, 32) || fallback.name;
  const members: PersonId[] = ["maya"];
  if (Array.isArray(data.members)) {
    for (const id of data.members) {
      if ((id === "kade" || id === "rin") && !members.includes(id)) members.push(id);
    }
  }
  return { name, members };
}

function cleanWindow(raw: unknown, fallback: ShipWindow): ShipWindow {
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<ShipWindow>;
  return {
    proof: typeof data.proof === "boolean" ? data.proof : fallback.proof,
    crew: typeof data.crew === "boolean" ? data.crew : fallback.crew,
    ideas: typeof data.ideas === "boolean" ? data.ideas : fallback.ideas,
    testers: typeof data.testers === "boolean" ? data.testers : fallback.testers,
  };
}

function cleanNotes(raw: unknown): ShipNote[] {
  if (!Array.isArray(raw)) return [];
  const notes: ShipNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const note = item as ShipNote;
    const id = cleanShipText(note.id, 24);
    if (!/^[a-z0-9-]+$/i.test(id)) continue;
    if (note.personId !== "maya" && note.personId !== "kade" && note.personId !== "rin") continue;
    if (note.status !== "pending" && note.status !== "kept" && note.status !== "dropped") continue;
    const text = cleanShipText(note.text, 200);
    if (!text) continue;
    if (notes.some((entry) => entry.id === id)) continue;
    notes.push({ id, personId: note.personId, text, status: note.status });
    if (notes.length === 24) break;
  }
  return notes;
}

function cleanIncident(raw: unknown): ShipIncident | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ShipIncident>;
  const text = cleanShipText(data.text, 160);
  if (!text) return null;
  return { text, open: data.open !== false };
}

function cleanRole(raw: unknown): ShipRole | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ShipRole>;
  const title = cleanShipText(data.title, 48);
  const brief = cleanShipText(data.brief, 140);
  if (!title || !brief) return null;
  return { title, brief, open: data.open === true };
}

function cleanRoleApps(raw: unknown): RoleApplication[] {
  if (!Array.isArray(raw)) return [];
  const apps: RoleApplication[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const personId = (item as RoleApplication).personId;
    const status = (item as RoleApplication).status;
    if (personId !== "maya" && personId !== "kade" && personId !== "rin") continue;
    if (status !== "pending" && status !== "accepted" && status !== "declined") continue;
    if (apps.some((entry) => entry.personId === personId)) continue;
    apps.push({ personId, status });
  }
  return apps.slice(0, 3);
}

function cleanShips(raw: unknown, published = false): YardShip[] {
  const seed = seedShips();
  const byId = new Map(seed.map((ship) => [ship.id, { ...ship }]));
  const extra: YardShip[] = [];
  if (!Array.isArray(raw)) return seed;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const id = cleanShipText((item as YardShip).id, 40);
    if (!/^[a-z0-9-]+$/i.test(id)) continue;
    const name = cleanShipText((item as YardShip).name, 40);
    if (!name) continue;
    const chain = cleanShipText((item as YardShip).chain, 32) || "Base";
    const line = cleanShipText((item as YardShip).line, 140);
    const known = byId.get(id);
    const stage = isStage((item as YardShip).stage) ? (item as YardShip).stage : undefined;
    const applications = cleanApplications((item as YardShip).applications);
    const storedProof = cleanShipText((item as YardShip).proof, 160);
    const proofs = Array.isArray((item as YardShip).proofs)
      ? cleanProofs((item as YardShip).proofs, "")
      : storedProof && known && storedProof !== known.proof
        ? cleanProofs(undefined, storedProof)
        : (known?.proofs ?? cleanProofs(undefined, storedProof));
    if (known) {
      if (known.mine) {
        byId.set(id, {
          ...known,
          name,
          chain,
          line,
          stage: stage ?? known.stage,
          seats: cleanSeats((item as YardShip).seats) ?? known.seats,
          proof: proofSummary(proofs),
          proofs,
          applications,
          ideas: cleanIdeaRoom((item as YardShip).ideas) ?? known.ideas,
          crew: cleanCrew((item as YardShip).crew, known.crew),
          window: cleanWindow((item as YardShip).window, known.window),
          notes: Array.isArray((item as YardShip).notes) ? cleanNotes((item as YardShip).notes) : known.notes,
          role: "role" in (item as YardShip) ? cleanRole((item as YardShip).role) : known.role,
          roleApps: Array.isArray((item as YardShip).roleApps) ? cleanRoleApps((item as YardShip).roleApps) : known.roleApps,
          incident: "incident" in (item as YardShip) ? cleanIncident((item as YardShip).incident) : known.incident,
          sunset: typeof (item as YardShip).sunset === "boolean" ? (item as YardShip).sunset : known.sunset,
          released:
            typeof (item as YardShip).released === "boolean"
              ? (item as YardShip).released
              : known.id === "vault-v2" && published
                ? true
                : known.released,
        });
      } else {
        const ideas = cleanIdeaRoom((item as YardShip).ideas);
        const notes = Array.isArray((item as YardShip).notes) ? cleanNotes((item as YardShip).notes) : known.notes;
        if (applications.length || ideas || notes.length) {
          byId.set(id, { ...known, applications, ideas: ideas ?? known.ideas, notes });
        }
      }
      continue;
    }
    extra.push({
      id,
      name,
      chain,
      line,
      mine: true,
      stage: stage ?? "Private",
      seats: cleanSeats((item as YardShip).seats),
      proof: proofSummary(proofs),
      proofs,
      applications,
      ideas: cleanIdeaRoom((item as YardShip).ideas),
      crew: cleanCrew((item as YardShip).crew, { name: "Crew", members: ["maya"] }),
      window: cleanWindow((item as YardShip).window, DEFAULT_WINDOW),
      notes: cleanNotes((item as YardShip).notes),
      role: cleanRole((item as YardShip).role),
      roleApps: cleanRoleApps((item as YardShip).roleApps),
      incident: cleanIncident((item as YardShip).incident),
      sunset: (item as YardShip).sunset === true,
      released: (item as YardShip).released === true,
    });
  }
  return [...byId.values(), ...extra];
}

function isColKey(value: unknown): value is ColKey {
  return value === "icebox" || value === "now" || value === "review" || value === "shipped";
}

function sanitize(raw: unknown): Persisted | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<Persisted>;
  const base = fresh();
  const tasks = { ...base.tasks };
  if (data.tasks && typeof data.tasks === "object") {
    for (const key of Object.keys(tasks) as ColKey[]) {
      const list = data.tasks[key];
      if (!Array.isArray(list)) continue;
      const seeded = new Map(Object.values(seedTasks()).flat().map((task) => [task.id, task.shipId]));
      tasks[key] = list.flatMap((task) => {
        if (!task || typeof task !== "object") return [];
        const data = task as Task;
        if (typeof data.id !== "string" || typeof data.title !== "string" || typeof data.who !== "string") return [];
        const stored = typeof data.shipId === "string" && /^[a-z0-9-]+$/i.test(data.shipId) ? data.shipId.slice(0, 40) : "";
        const shipId = stored || seeded.get(data.id) || "";
        return [{ id: data.id, title: data.title, who: data.who, ...(shipId ? { shipId } : {}) }];
      });
    }
  }
  const ships = cleanShips(data.ships, data.published === true);
  const requested = typeof data.shipId === "string" ? data.shipId : base.shipId;
  return {
    ...base,
    signedIn: data.signedIn === true,
    unpublished: data.unpublished !== false,
    published: data.published === true,
    watches: Array.isArray(data.watches) ? data.watches.filter((id) => typeof id === "string") : base.watches,
    collects: Array.isArray(data.collects) ? data.collects.filter((id) => typeof id === "string") : [],
    tasks,
    nav: typeof data.nav === "string" ? (data.nav as DeskView) : base.nav,
    phoneTab: typeof data.phoneTab === "string" ? (data.phoneTab as PhoneTab) : base.phoneTab,
    yardTab: typeof data.yardTab === "string" ? (data.yardTab as YardTab) : base.yardTab,
    filter: typeof data.filter === "string" ? (data.filter as FeedFilter) : base.filter,
    sheet: data.sheet === "ship" || data.sheet === "diligence" || data.sheet === "person" || data.sheet === "log" ? data.sheet : null,
    profile: cleanProfile(data.profile),
    ships,
    shipId: ships.some((ship) => ship.id === requested) ? requested : "vault-v2",
    personId: data.personId === "maya" || data.personId === "kade" || data.personId === "rin" ? data.personId : null,
    log: cleanLog(data.log, ships),
  };
}

function readStorage(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return null;
  }
}

function writeStorage(state: YardState) {
  if (typeof window === "undefined") return;
  const snapshot: Persisted = {
    signedIn: state.signedIn,
    unpublished: state.unpublished,
    published: state.published,
    watches: state.watches,
    collects: state.collects,
    tasks: state.tasks,
    nav: state.nav,
    phoneTab: state.phoneTab,
    yardTab: state.yardTab,
    filter: state.filter,
    sheet: state.sheet,
    profile: state.profile,
    ships: state.ships,
    shipId: state.shipId,
    personId: state.personId,
    log: state.log,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function relocate(tasks: Record<ColKey, Task[]>, id: string, from: ColKey, to: ColKey) {
  if (!isColKey(from) || !isColKey(to)) return tasks;
  const item = tasks[from].find((task) => task.id === id);
  if (!item) return tasks;
  if (from === to) {
    return {
      ...tasks,
      [to]: [...tasks[to].filter((task) => task.id !== id), item],
    };
  }
  return {
    ...tasks,
    [from]: tasks[from].filter((task) => task.id !== id),
    [to]: [...tasks[to], item],
  };
}

function renameTask(tasks: Record<ColKey, Task[]>, id: string, title: string) {
  const next = { ...tasks };
  for (const key of Object.keys(next) as ColKey[]) {
    next[key] = next[key].map((task) => (task.id === id ? { ...task, title } : task));
  }
  return next;
}

function personName(id: PersonId) {
  if (id === "kade") return "Kade";
  if (id === "rin") return "Rin";
  return "0xMaya";
}

export const useYard = create<YardState>((set, get) => ({
  ...fresh(),
  hydrated: false,
  preview: false,
  toast: null,
  modal: null,
  hydrate: () => {
    const saved = readStorage();
    if (saved) set({ ...saved, hydrated: true, toast: null, modal: null });
    else set({ hydrated: true });
  },
  signIn: () => {
    set({
      signedIn: true,
      toast: "Signed in as 0xMaya.",
    });
    writeStorage(get());
  },
  dismissToast: () => set({ toast: null }),
  openPublish: () => set({ modal: "publish" }),
  cancelModal: () => set({ modal: null }),
  publish: () => {
    const state = get();
    const shipped = state.tasks.shipped.some((task) => task.id === "t-deploy")
      ? state.tasks.shipped
      : [{ id: "t-deploy", title: "vault-v2 deploy", who: "Maya", shipId: "vault-v2" }, ...state.tasks.shipped];
    set({
      unpublished: false,
      published: true,
      tasks: { ...state.tasks, shipped },
      modal: null,
      nav: "home",
      phoneTab: "feed",
      sheet: null,
      ships: state.ships.map((ship) => (ship.id === "vault-v2" ? { ...ship, stage: "Alive", released: true } : ship)),
      toast: "Ship Event live. Watchers will get a push.",
      log: pushLog(state.log, "Published the vault-v2 ship event."),
    });
    writeStorage(get());
  },
  moveTask: (id, from, to) => {
    const state = get();
    const tasks = relocate(state.tasks, id, from, to);
    const ownShip = state.ships.some((ship) => ship.id === id && ship.mine && ship.id !== "vault-v2");
    const enteredShipped = to === "shipped" && from !== "shipped" && state.unpublished && !ownShip;
    set({
      tasks,
      modal: enteredShipped ? "publish" : state.modal,
    });
    writeStorage(get());
  },
  addWork: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.sunset) return;
    const title = input.title.trim().slice(0, 48);
    const names = { maya: "Maya", kade: "Kade", rin: "Rin" };
    const who = input.who.trim();
    if (!title || !ship.crew.members.some((personId) => names[personId] === who)) return;
    const task: Task = { id: `w-${Date.now().toString(36)}`, title, who, shipId: ship.id };
    const state = get();
    set({
      tasks: { ...state.tasks, icebox: [task, ...state.tasks.icebox] },
      toast: `${title} is in Icebox.`,
      log: pushLog(state.log, `Work added on ${ship.name}.`),
    });
    writeStorage(get());
  },
  toggleWatch: (shipId) => {
    const watching = get().watches.includes(shipId);
    const watches = watching ? get().watches.filter((id) => id !== shipId) : [...get().watches, shipId];
    set({
      watches,
      toast: watching ? `Unwatched ${shipId}.` : `Watching ${shipId}. Next deploy pushes.`,
    });
    writeStorage(get());
  },
  collect: (id) => {
    const state = get();
    if (!state.published && id === "e-deploy") {
      set({ toast: "Publish the deploy first." });
      return;
    }
    if (state.collects.includes(id)) return;
    set({
      collects: [...state.collects, id],
      toast: "Collected.",
    });
    writeStorage(get());
  },
  setNav: (nav) => {
    set({ nav, sheet: null, personId: nav === "people" ? null : get().personId, preview: false });
    writeStorage(get());
  },
  setPhoneTab: (phoneTab) => {
    set({ phoneTab, sheet: null });
    writeStorage(get());
  },
  setYardTab: (yardTab) => {
    set({ yardTab });
    writeStorage(get());
  },
  setFilter: (filter) => {
    set({ filter });
    writeStorage(get());
  },
  openShip: (id) => {
    const ships = get().ships;
    const shipId = id && ships.some((ship) => ship.id === id) ? id : "vault-v2";
    set({ shipId, nav: "ships", sheet: "ship", preview: false });
    writeStorage(get());
  },
  focusShip: (id) => {
    if (!get().ships.some((ship) => ship.id === id)) return;
    set({ shipId: id, preview: false });
    writeStorage(get());
  },
  openDiligence: () => {
    set({ nav: "diligence", sheet: "diligence" });
    writeStorage(get());
  },
  openLog: () => {
    set({ nav: "messages", sheet: "log" });
    writeStorage(get());
  },
  closeSheet: () => {
    set({ sheet: null });
    writeStorage(get());
  },
  updateProfile: (profile) => {
    set({ profile: cleanProfile(profile), toast: "Profile saved." });
    writeStorage(get());
  },
  createShip: (input) => {
    const name = input.name.trim().slice(0, 40);
    if (!name) return;
    const id = `s-${Date.now().toString(36)}`;
    const ship: YardShip = {
      id,
      name,
      chain: input.chain.trim().slice(0, 32) || "Base",
      line: input.line.trim().slice(0, 140),
      mine: true,
      stage: "Private",
      seats: null,
      proof: "",
      proofs: [],
      applications: [],
      ideas: null,
      crew: { name: "Crew", members: ["maya"] },
      window: DEFAULT_WINDOW,
      notes: [],
      role: null,
      roleApps: [],
      incident: null,
      sunset: false,
      released: false,
    };
    const state = get();
    set({
      ships: [...state.ships, ship],
      tasks: {
        ...state.tasks,
        icebox: [{ id, title: name, who: "Maya" }, ...state.tasks.icebox],
      },
      shipId: id,
      nav: "ships",
      sheet: "ship",
      toast: `${name} is in Icebox.`,
      log: pushLog(state.log, `${name} started on Private.`),
    });
    writeStorage(get());
  },
  updateShip: (id, input) => {
    const state = get();
    const current = state.ships.find((ship) => ship.id === id);
    if (!current?.mine) return;
    const name = input.name.trim().slice(0, 40);
    if (!name) return;
    const next: YardShip = {
      ...current,
      name,
      chain: input.chain.trim().slice(0, 32) || "Base",
      line: input.line.trim().slice(0, 140),
    };
    set({
      ships: state.ships.map((ship) => (ship.id === id ? next : ship)),
      tasks: renameTask(state.tasks, id, name),
      toast: "Ship saved.",
    });
    writeStorage(get());
  },
  openPerson: (id) => {
    if (id !== "maya" && id !== "kade" && id !== "rin") return;
    set({ personId: id, nav: "people", sheet: "person" });
    writeStorage(get());
  },
  closePerson: () => {
    set({ personId: null, sheet: null });
    writeStorage(get());
  },
  stepStage: (id, direction) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.sunset) return;
    const index = STAGES.indexOf(ship.stage);
    const next = index + direction;
    if (next < 0 || next >= STAGES.length) return;
    if (direction === 1 && ship.stage === "Audit" && !ship.proofs.some((row) => row.kind === "Audit")) {
      set({ toast: "Pin an audit row before Mainnet." });
      return;
    }
    const stage = STAGES[next];
    set({
      ships: get().ships.map((item) =>
        item.id === id ? { ...item, stage, released: stage === "Alive" ? item.released : false } : item,
      ),
      toast: `${ship.name} is on ${stage}.`,
      log: pushLog(get().log, `${ship.name} moved to ${stage}.`),
    });
    writeStorage(get());
  },
  setSunset: (id, on) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine) return;
    if (on && !windowLive(ship.stage)) {
      set({ toast: "Sunset is for Mainnet or Alive." });
      return;
    }
    if (ship.sunset === on) return;
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, sunset: on } : item)),
      toast: on ? `${ship.name} is sunset.` : `${ship.name} is open again.`,
      log: pushLog(get().log, on ? `${ship.name} sunset.` : `${ship.name} reopened.`),
    });
    writeStorage(get());
  },
  release: (id) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.sunset || ship.stage !== "Alive" || ship.released) return;
    if (ship.id === "vault-v2") {
      get().openPublish();
      return;
    }
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, released: true } : item)),
      toast: `${ship.name} is on Home.`,
      log: pushLog(get().log, `${ship.name} is on Home.`),
    });
    writeStorage(get());
  },
  saveSeats: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.stage !== "Testnet") return;
    const brief = input.brief.trim().slice(0, 140);
    if (!brief) return;
    const count = Math.min(12, Math.max(1, Math.round(input.count) || 1));
    const seats: ShipSeats = { count, brief, link: input.link.trim().slice(0, 200) };
    const seeded = ship.applications.length === 0;
    const applications = seeded ? [{ personId: "kade" as const, status: "pending" as const }] : ship.applications;
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, seats, applications } : item)),
      toast: seeded ? "Seats open. Kade applied with his card." : "Seats saved.",
    });
    writeStorage(get());
  },
  saveProof: (id, rows) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || STAGES.indexOf(ship.stage) < STAGES.indexOf("Audit")) return;
    const proofs = cleanProofs(rows, "");
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, proofs, proof: proofSummary(proofs) } : item)),
      toast: proofs.some((row) => row.kind === "Audit") ? "Proof pinned." : "Audit row is still open.",
      log: pushLog(get().log, `Proof updated on ${ship.name}.`),
    });
    writeStorage(get());
  },
  applySeat: (id) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship || ship.mine || ship.stage !== "Testnet" || !ship.seats) return;
    const mine = ship.applications.find((entry) => entry.personId === "maya");
    if (mine?.status === "declined") {
      set({ toast: "Declined." });
      return;
    }
    if (mine) {
      set({ toast: "Already applied." });
      return;
    }
    const taken = ship.applications.filter((entry) => entry.status !== "declined").length;
    if (taken >= ship.seats.count) {
      set({ toast: "No seats left." });
      return;
    }
    set({
      ships: get().ships.map((item) =>
        item.id === id
          ? { ...item, applications: [...item.applications, { personId: "maya" as const, status: "pending" as const }] }
          : item,
      ),
      toast: "Applied with your card.",
    });
    writeStorage(get());
  },
  acceptTester: (id, personId) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || !ship.seats) return;
    const entry = ship.applications.find((item) => item.personId === personId);
    if (!entry || entry.status !== "pending") return;
    const accepted = ship.applications.filter((item) => item.status === "accepted").length;
    if (accepted >= ship.seats.count) {
      set({ toast: "No seats left." });
      return;
    }
    set({
      ships: get().ships.map((item) =>
        item.id === id
          ? {
              ...item,
              applications: item.applications.map((entry) =>
                entry.personId === personId ? { ...entry, status: "accepted" as const } : entry,
              ),
            }
          : item,
      ),
      toast: `${personName(personId)} is on this testnet.`,
      log: pushLog(get().log, `${personName(personId)} accepted on ${ship.name}.`),
    });
    writeStorage(get());
  },
  declineTester: (id, personId) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine) return;
    const entry = ship.applications.find((item) => item.personId === personId);
    if (!entry || entry.status !== "pending") return;
    set({
      ships: get().ships.map((item) =>
        item.id === id
          ? {
              ...item,
              applications: item.applications.map((row) =>
                row.personId === personId ? { ...row, status: "declined" as const } : row,
              ),
            }
          : item,
      ),
      toast: `Declined ${personName(personId)}.`,
      log: pushLog(get().log, `Declined ${personName(personId)} for a seat on ${ship.name}.`),
    });
    writeStorage(get());
  },
  saveIdeaRoom: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.stage !== "Idea") return;
    const sections = input.sections
      .map((section, index) => ({
        id: /^[a-z0-9-]+$/i.test(section.id) ? section.id.slice(0, 20) : `s${index + 1}`,
        name: section.name.trim().slice(0, 32),
        prompt: section.prompt.trim().slice(0, 80),
      }))
      .filter((section) => section.name && section.prompt)
      .slice(0, 3);
    if (!sections.length) return;
    const allowed = new Set(sections.map((section) => section.id));
    let ideas = (ship.ideas?.ideas ?? []).filter((idea) => allowed.has(idea.sectionId));
    const seeded = input.access !== "closed" && ideas.length === 0;
    if (seeded) {
      ideas = [
        {
          id: "kade-1",
          sectionId: sections[0].id,
          personId: "kade",
          text: "Let the exit stay open during the first week.",
          link: input.links ? "https://example.com/exit-note" : "",
          status: "pending",
          votes: [],
        },
      ];
    }
    if (!input.links) ideas = ideas.map((idea) => ({ ...idea, link: "" }));
    if (!input.votes) ideas = ideas.map((idea) => ({ ...idea, votes: [] }));
    const ideasRoom: IdeaRoom = {
      access: input.access,
      links: input.links,
      votes: input.votes,
      sections,
      ideas,
    };
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, ideas: ideasRoom } : item)),
      toast: seeded ? "Idea room open. Kade left one." : "Idea room saved.",
    });
    writeStorage(get());
  },
  setIdeaStatus: (id, ideaId, status) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || !ship.ideas) return;
    set({
      ships: get().ships.map((item) =>
        item.id === id && item.ideas
          ? {
              ...item,
              ideas: {
                ...item.ideas,
                ideas: item.ideas.ideas.map((idea) =>
                  idea.id === ideaId ? { ...idea, status, votes: status === "kept" ? idea.votes : [] } : idea,
                ),
              },
            }
          : item,
      ),
      toast: status === "kept" ? "Kept. It stays on the ship." : "Dropped.",
      log: pushLog(get().log, status === "kept" ? `Kept an idea on ${ship.name}.` : `Dropped an idea on ${ship.name}.`),
    });
    writeStorage(get());
  },
  voteIdea: (id, ideaId) => {
    const ship = get().ships.find((item) => item.id === id);
    const room = ship?.ideas;
    if (!ship || !room?.votes || ship.stage !== "Idea") return;
    const idea = room.ideas.find((item) => item.id === ideaId);
    if (!idea || idea.status !== "kept" || idea.personId === "maya") return;
    const voted = idea.votes.includes("maya");
    set({
      ships: get().ships.map((item) =>
        item.id === id && item.ideas
          ? {
              ...item,
              ideas: {
                ...item.ideas,
                ideas: item.ideas.ideas.map((entry) =>
                  entry.id === ideaId
                    ? { ...entry, votes: voted ? entry.votes.filter((vote) => vote !== "maya") : [...entry.votes, "maya"] }
                    : entry,
                ),
              },
            }
          : item,
      ),
      toast: voted ? "Vote taken back." : "Voted with your card.",
    });
    writeStorage(get());
  },
  submitIdea: (id, sectionId, text, link) => {
    const ship = get().ships.find((item) => item.id === id);
    const room = ship?.ideas;
    if (!ship || ship.mine || ship.stage !== "Idea" || !room || room.access === "closed") return;
    const body = text.trim().slice(0, 280);
    if (!body || !room.sections.some((section) => section.id === sectionId)) return;
    if (room.ideas.some((idea) => idea.personId === "maya" && idea.sectionId === sectionId && idea.status !== "dropped")) {
      set({ toast: "You already left one here." });
      return;
    }
    const idea: ShipIdea = {
      id: `m-${Date.now().toString(36)}`,
      sectionId,
      personId: "maya",
      text: body,
      link: room.links ? link.trim().slice(0, 200) : "",
      status: "pending",
      votes: [],
    };
    set({
      ships: get().ships.map((item) =>
        item.id === id && item.ideas ? { ...item, ideas: { ...item.ideas, ideas: [...item.ideas.ideas, idea] } } : item,
      ),
      toast: "Idea sent. The owner keeps or drops it.",
    });
    writeStorage(get());
  },
  saveCrew: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine) return;
    const name = input.name.trim().slice(0, 32);
    if (!name) return;
    const members: PersonId[] = ["maya"];
    for (const personId of input.members) {
      if ((personId === "kade" || personId === "rin") && !members.includes(personId)) members.push(personId);
    }
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, crew: { name, members } } : item)),
      toast: `${name} saved.`,
    });
    writeStorage(get());
  },
  saveWindow: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || (ship.stage !== "Mainnet" && ship.stage !== "Alive")) return;
    const next: ShipWindow = {
      proof: input.proof === true,
      crew: input.crew === true,
      ideas: input.ideas === true,
      testers: input.testers === true,
    };
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, window: next } : item)),
      toast: "Window saved.",
      log: pushLog(get().log, `Window saved on ${ship.name}.`),
    });
    writeStorage(get());
  },
  setPreview: (on) => set({ preview: on }),
  submitNote: (id, text) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship || ship.mine || ship.sunset) return;
    const body = text.trim().slice(0, 200);
    if (!body) return;
    if (ship.notes.some((note) => note.personId === "maya" && note.status !== "dropped")) {
      set({ toast: "You already left one." });
      return;
    }
    const note: ShipNote = { id: `n-${Date.now().toString(36)}`, personId: "maya", text: body, status: "pending" };
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, notes: [...item.notes, note] } : item)),
      toast: "Sent. The owner keeps or drops it.",
      log: pushLog(get().log, `You left a suggestion on ${ship.name}.`),
    });
    writeStorage(get());
  },
  setNoteStatus: (id, noteId, status) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine) return;
    set({
      ships: get().ships.map((item) =>
        item.id === id
          ? { ...item, notes: item.notes.map((note) => (note.id === noteId ? { ...note, status } : note)) }
          : item,
      ),
      toast: status === "kept" ? "Kept on the ship." : "Dropped.",
      log: pushLog(get().log, status === "kept" ? `Kept a suggestion on ${ship.name}.` : `Dropped a suggestion on ${ship.name}.`),
    });
    writeStorage(get());
  },
  saveRole: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.sunset) return;
    const title = input.title.trim().slice(0, 48);
    const brief = input.brief.trim().slice(0, 140);
    if (!title || !brief) return;
    const seeded = input.open && ship.roleApps.length === 0;
    const roleApps = seeded ? [{ personId: "kade" as const, status: "pending" as const }] : ship.roleApps;
    set({
      ships: get().ships.map((item) =>
        item.id === id ? { ...item, role: { title, brief, open: input.open }, roleApps } : item,
      ),
      toast: seeded ? "Role open. Kade applied with his card." : input.open ? "Role saved." : "Role closed.",
      log: pushLog(get().log, input.open ? `Role open on ${ship.name}.` : `Role closed on ${ship.name}.`),
    });
    writeStorage(get());
  },
  saveIncident: (id, input) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || ship.sunset) return;
    const text = input.text.trim().slice(0, 160);
    const incident = text ? { text, open: input.open } : null;
    set({
      ships: get().ships.map((item) => (item.id === id ? { ...item, incident } : item)),
      toast: !incident ? "Incident cleared." : incident.open ? "Incident disclosed." : "Incident closed. It stays on the record.",
      log: pushLog(
        get().log,
        !incident ? `Incident cleared on ${ship.name}.` : incident.open ? `Incident disclosed on ${ship.name}.` : `Incident closed on ${ship.name}.`,
      ),
    });
    writeStorage(get());
  },
  applyRole: (id) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship || ship.mine || !ship.role?.open) return;
    if (ship.crew.members.includes("maya")) {
      set({ toast: "You're already on this crew." });
      return;
    }
    const mine = ship.roleApps.find((entry) => entry.personId === "maya");
    if (mine?.status === "declined") {
      set({ toast: "Declined." });
      return;
    }
    if (mine) {
      set({ toast: "Already applied." });
      return;
    }
    set({
      ships: get().ships.map((item) =>
        item.id === id ? { ...item, roleApps: [...item.roleApps, { personId: "maya" as const, status: "pending" as const }] } : item,
      ),
      toast: "Applied with your card.",
      log: pushLog(get().log, `You applied for the role on ${ship.name}.`),
    });
    writeStorage(get());
  },
  acceptRole: (id, personId) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || !ship.role) return;
    const entry = ship.roleApps.find((item) => item.personId === personId);
    if (!entry || entry.status !== "pending") return;
    const members = ship.crew.members.includes(personId) ? ship.crew.members : [...ship.crew.members, personId];
    set({
      ships: get().ships.map((item) =>
        item.id === id
          ? {
              ...item,
              role: { ...ship.role!, open: false },
              roleApps: item.roleApps.map((entry) => (entry.personId === personId ? { ...entry, status: "accepted" as const } : entry)),
              crew: { ...item.crew, members },
            }
          : item,
      ),
      toast: `${personName(personId)} filled the role.`,
      log: pushLog(get().log, `${personName(personId)} filled the role on ${ship.name}.`),
    });
    writeStorage(get());
  },
  declineRole: (id, personId) => {
    const ship = get().ships.find((item) => item.id === id);
    if (!ship?.mine || !ship.role) return;
    const entry = ship.roleApps.find((item) => item.personId === personId);
    if (!entry || entry.status !== "pending") return;
    set({
      ships: get().ships.map((item) =>
        item.id === id
          ? {
              ...item,
              roleApps: item.roleApps.map((row) => (row.personId === personId ? { ...row, status: "declined" as const } : row)),
            }
          : item,
      ),
      toast: `Declined ${personName(personId)}.`,
      log: pushLog(get().log, `Declined ${personName(personId)} for the role on ${ship.name}.`),
    });
    writeStorage(get());
  },
}));
