export type ColKey = "icebox" | "now" | "review" | "shipped";
export type DeskView =
  | "home"
  | "yard"
  | "ships"
  | "people"
  | "launch"
  | "diligence"
  | "messages"
  | "me";
export type PhoneTab = "feed" | "watch" | "launch" | "crew" | "card";
export type YardTab = "overview" | "board" | "repos" | "room" | "window" | "people";
export type FeedFilter = "watched" | "deploys" | "hiring" | "incidents";
export type Sheet = null | "ship" | "diligence" | "person" | "log";

export type Profile = {
  bio: string;
  link: string;
  avatar: string;
  banner: string;
};

export const BIO_MAX = 160;
export const LINK_MAX = 200;

export const DEFAULT_PROFILE: Profile = {
  bio: "Solidity. Harbor crew. I publish what I ship.",
  link: "",
  avatar: "",
  banner: "",
};

const IMAGE_MAX = 450_000;

function cleanImage(value: unknown): string {
  if (typeof value !== "string" || value.length > IMAGE_MAX) return "";
  if (
    value.startsWith("data:image/jpeg;base64,") ||
    value.startsWith("data:image/png;base64,") ||
    value.startsWith("data:image/webp;base64,")
  ) {
    return value;
  }
  return "";
}

export function cleanProfile(raw: unknown): Profile {
  const data = raw && typeof raw === "object" ? (raw as Partial<Profile>) : {};
  return {
    bio: typeof data.bio === "string" ? data.bio.slice(0, BIO_MAX) : DEFAULT_PROFILE.bio,
    link: typeof data.link === "string" ? data.link.trim().slice(0, LINK_MAX) : "",
    avatar: cleanImage(data.avatar),
    banner: cleanImage(data.banner),
  };
}

export function profileHref(link: string): string | null {
  const trimmed = link.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export type Task = { id: string; title: string; who: string; shipId?: string };

export type ShipEvent = {
  id: string;
  verb: "DEPLOYED" | "AUDITED" | "ROLE OPEN" | "INCIDENT";
  kind: "deploy" | "audit" | "role" | "incident";
  title: string;
  who: string;
  when: string;
  body: string;
  proof: string;
  shipId: string;
};

export const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "icebox", label: "ICEBOX" },
  { key: "now", label: "NOW" },
  { key: "review", label: "REVIEW" },
  { key: "shipped", label: "SHIPPED" },
];

export const COLUMN_ORDER: ColKey[] = ["icebox", "now", "review", "shipped"];

export const SCORES = [
  { key: "ship", short: "S", label: "SHIP", value: 72 },
  { key: "craft", short: "C", label: "CRAFT", value: 64 },
  { key: "crew", short: "R", label: "CREW", value: 51 },
  { key: "word", short: "W", label: "WORD", value: 68 },
] as const;

export const CREW = [
  { name: "Maya", role: "lead", initial: "M" },
  { name: "Kade", role: "contracts", initial: "K" },
  { name: "Rin", role: "design", initial: "R" },
] as const;

export const STAGES = ["Idea", "Private", "Testnet", "Audit", "Mainnet", "Alive"] as const;

export type ShipStage = (typeof STAGES)[number];

export type ShipSeats = {
  count: number;
  brief: string;
  link: string;
};

export type ShipApplication = {
  personId: "maya" | "kade" | "rin";
  status: "pending" | "accepted" | "declined";
};

export type IdeaAccess = "open" | "crew" | "closed";

export type IdeaSection = {
  id: string;
  name: string;
  prompt: string;
};

export type ShipIdea = {
  id: string;
  sectionId: string;
  personId: "maya" | "kade" | "rin";
  text: string;
  link: string;
  status: "pending" | "kept" | "dropped";
  votes: Array<"maya" | "kade" | "rin">;
};

export type IdeaRoom = {
  access: IdeaAccess;
  links: boolean;
  votes: boolean;
  sections: IdeaSection[];
  ideas: ShipIdea[];
};

export type ShipProof = {
  kind: "Deploy" | "Audit" | "Test";
  text: string;
};

export const PROOF_KINDS = ["Deploy", "Audit", "Test"] as const;

export type ShipIncident = {
  text: string;
  open: boolean;
};

export type ShipNote = {
  id: string;
  personId: "maya" | "kade" | "rin";
  text: string;
  status: "pending" | "kept" | "dropped";
};

export type ShipRole = {
  title: string;
  brief: string;
  open: boolean;
};

export type RoleApplication = {
  personId: "maya" | "kade" | "rin";
  status: "pending" | "accepted" | "declined";
};

export type ShipCrew = {
  name: string;
  members: Array<"maya" | "kade" | "rin">;
};

export type ShipWindow = {
  proof: boolean;
  crew: boolean;
  ideas: boolean;
  testers: boolean;
};

export const DEFAULT_WINDOW: ShipWindow = {
  proof: true,
  crew: true,
  ideas: false,
  testers: false,
};

export function windowLive(stage: ShipStage) {
  return stage === "Mainnet" || stage === "Alive";
}

export function showInWindow(ship: YardShip, key: keyof ShipWindow, asYard: boolean) {
  if (ship.sunset) return asYard;
  if (asYard || !windowLive(ship.stage)) return true;
  return ship.window[key];
}

export function shipStageLabel(ship: { sunset?: boolean; stage: ShipStage }) {
  return ship.sunset ? "Sunset" : ship.stage;
}

export const CHAINS = ["Base", "Ethereum", "Arbitrum", "Optimism"] as const;

export type YardShip = {
  id: string;
  name: string;
  chain: string;
  line: string;
  mine: boolean;
  stage: ShipStage;
  seats: ShipSeats | null;
  proof: string;
  proofs: ShipProof[];
  applications: ShipApplication[];
  ideas: IdeaRoom | null;
  crew: ShipCrew;
  window: ShipWindow;
  notes: ShipNote[];
  role: ShipRole | null;
  roleApps: RoleApplication[];
  incident: ShipIncident | null;
  sunset: boolean;
  released: boolean;
};

export function seedShips(): YardShip[] {
  return [
    {
      id: "vault-v2",
      name: "vault-v2",
      chain: "Base",
      line: "Verified deploy. Still private until you publish.",
      mine: true,
      stage: "Audit",
      seats: null,
      proof: "Spearbit PDF hashed · Vault 0x4f2a…91c",
      proofs: [
        { kind: "Deploy", text: "Base · Vault 0x4f2a…91c" },
        { kind: "Audit", text: "Spearbit PDF hashed · Vault 0x4f2a…91c" },
      ],
      applications: [],
      ideas: null,
      crew: { name: "Harbor", members: ["maya", "kade", "rin"] },
      window: DEFAULT_WINDOW,
      notes: [{ id: "n-kade", personId: "kade", text: "Say what the user gets back on the exit.", status: "pending" }],
      role: { title: "Need Solidity for 6 weeks", brief: "Craft and prior ships. No follower count.", open: true },
      roleApps: [{ personId: "kade", status: "pending" }],
      incident: null,
      sunset: false,
      released: false,
    },
    {
      id: "hook-router",
      name: "hook-router",
      chain: "Arbitrum",
      line: "Alive 186d.",
      mine: false,
      stage: "Alive",
      seats: null,
      proof: "Spearbit · hook-router · Arbitrum",
      proofs: [{ kind: "Audit", text: "Spearbit · hook-router · Arbitrum" }],
      applications: [],
      ideas: null,
      crew: { name: "Router", members: ["maya", "kade"] },
      window: DEFAULT_WINDOW,
      notes: [],
      role: null,
      roleApps: [],
      incident: null,
      sunset: false,
      released: true,
    },
    {
      id: "points-lens",
      name: "points-lens",
      chain: "Ethereum",
      line: "Sunset. Closed clean.",
      mine: false,
      stage: "Alive",
      seats: null,
      proof: "",
      proofs: [],
      applications: [],
      ideas: null,
      crew: { name: "Lens", members: ["maya"] },
      window: { proof: false, crew: true, ideas: false, testers: false },
      notes: [],
      role: null,
      roleApps: [],
      incident: null,
      sunset: true,
      released: true,
    },
  ];
}
export type PersonId = "maya" | "kade" | "rin";

export type PersonScore = { key: (typeof SCORES)[number]["key"]; label: string; value: number };

export type Person = {
  id: PersonId;
  name: string;
  handle: string;
  role: string;
  initial: string;
  bio: string;
  focus: string;
  ships: string[];
  scores: readonly PersonScore[];
  delivery: number;
};

export const PEOPLE: readonly Person[] = [
  {
    id: "maya",
    name: "0xMaya",
    handle: "maya-eth",
    role: "lead",
    initial: "M",
    bio: "",
    focus: "Solidity · Harbor crew · Base / ETH",
    ships: ["vault-v2", "hook-router", "points-lens"],
    scores: SCORES,
    delivery: 72,
  },
  {
    id: "kade",
    name: "Kade",
    handle: "kade",
    role: "contracts",
    initial: "K",
    bio: "Vault and oracle. I stay on the contracts until the hash matches.",
    focus: "Solidity · Harbor · Base / Arbitrum",
    ships: ["vault-v2", "hook-router"],
    scores: [
      { key: "ship", label: "SHIP", value: 61 },
      { key: "craft", label: "CRAFT", value: 70 },
      { key: "crew", label: "CREW", value: 48 },
      { key: "word", label: "WORD", value: 64 },
    ],
    delivery: 61,
  },
  {
    id: "rin",
    name: "Rin",
    handle: "rin",
    role: "design",
    initial: "R",
    bio: "The public window. I design what a ship is allowed to show.",
    focus: "Design · Harbor · Base",
    ships: ["vault-v2", "hook-router"],
    scores: [
      { key: "ship", label: "SHIP", value: 44 },
      { key: "craft", label: "CRAFT", value: 58 },
      { key: "crew", label: "CREW", value: 66 },
      { key: "word", label: "WORD", value: 71 },
    ],
    delivery: 44,
  },
];

export function personById(id: string | null): Person | undefined {
  return PEOPLE.find((person) => person.id === id);
}

export function seedTasks(): Record<ColKey, Task[]> {
  return {
    icebox: [
      { id: "t1", title: "Oracle rewrite", who: "Kade", shipId: "vault-v2" },
      { id: "t2", title: "Docs site", who: "Rin", shipId: "vault-v2" },
    ],
    now: [
      { id: "t3", title: "Invariants", who: "Maya", shipId: "vault-v2" },
      { id: "t4", title: "UI freeze", who: "Rin", shipId: "vault-v2" },
    ],
    review: [{ id: "t5", title: "Vault PR #88", who: "Maya", shipId: "vault-v2" }],
    shipped: [],
  };
}

export function aliveEvent(ship: YardShip, published: boolean): ShipEvent | null {
  if (ship.sunset || ship.stage !== "Alive") return null;
  const onFeed = ship.released || (ship.id === "vault-v2" && published);
  if (ship.mine && !onFeed) return null;
  const deploy = ship.proofs.find((row) => row.kind === "Deploy");
  const audit = ship.proofs.find((row) => row.kind === "Audit");
  const proof = deploy?.text || audit?.text || `${ship.chain} · ${ship.name}`;
  return {
    id: ship.id === "vault-v2" ? "e-deploy" : `alive-${ship.id}`,
    verb: deploy ? "DEPLOYED" : "AUDITED",
    kind: deploy ? "deploy" : "audit",
    title: deploy ? `${ship.name} is live on ${ship.chain}` : `${ship.name} audit is on the record`,
    who: ship.crew.name,
    when: ship.id === "vault-v2" ? "just now" : ship.line || "Alive",
    body: proof,
    proof,
    shipId: ship.id,
  };
}

export function shipEvents(ships: YardShip[], published: boolean): ShipEvent[] {
  return ships.flatMap((ship) => {
    const event = aliveEvent(ship, published);
    return event ? [event] : [];
  });
}

export function roleEvent(ship: YardShip): ShipEvent | null {
  if (!ship.role?.open || !ship.role.title) return null;
  return {
    id: `role-${ship.id}`,
    verb: "ROLE OPEN",
    kind: "role",
    title: ship.role.title,
    who: ship.crew.name,
    when: ship.stage,
    body: ship.role.brief,
    proof: `${ship.chain} · ${ship.name}`,
    shipId: ship.id,
  };
}

export function incidentEvent(ship: YardShip): ShipEvent | null {
  if (!ship.incident?.text) return null;
  return {
    id: `incident-${ship.id}`,
    verb: "INCIDENT",
    kind: "incident",
    title: ship.incident.open ? "Open incident" : "Disclosed and closed",
    who: ship.crew.name,
    when: ship.sunset ? "Sunset" : ship.stage,
    body: ship.incident.text,
    proof: `${ship.chain} · ${ship.name}`,
    shipId: ship.id,
  };
}

export function filterEvents(events: ShipEvent[], filter: FeedFilter, watches: string[]): ShipEvent[] {
  if (filter === "deploys") return events.filter((event) => event.kind === "deploy");
  if (filter === "hiring") return events.filter((event) => event.kind === "role");
  if (filter === "incidents") return events.filter((event) => event.kind === "incident");
  return events.filter((event) => watches.includes(event.shipId));
}
