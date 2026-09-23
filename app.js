const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const state = {
  user: null, nav: "home", yardTab: "board", phoneTab: "feed", filter: "watched",
  unpublished: true, published: false, watches: new Set(["vault-v2"]), collects: new Set(),
  toast: null, modal: null,
  tasks: {
    icebox: [{ id: "t1", title: "Oracle rewrite", who: "Kade" }, { id: "t2", title: "Docs site", who: "Rin" }],
    now: [{ id: "t3", title: "Invariants", who: "Maya" }, { id: "t4", title: "UI freeze", who: "Rin" }],
    review: [{ id: "t5", title: "Vault PR #88", who: "Maya" }],
    shipped: []
  }
};
const eventsSeed = [
  { id: "e-role", verb: "ROLE OPEN", kind: "role", title: "Need Solidity for 6 weeks", who: "Harbor", when: "5h ago", body: "Paid milestone. Craft beats follower count.", proof: "Public role  ·  Base  ·  6 weeks" },
  { id: "e-audit", verb: "AUDITED", kind: "audit", title: "hook-router audit published", who: "Harbor", when: "1d ago", body: "12 findings closed. Hash pinned.", proof: "Spearbit  ·  hook-router  ·  Arbitrum" }
];
function scoresHtml() {
  return `<div class="scores"><span class="pill s">S 72</span><span class="pill c">C 64</span><span class="pill r">R 51</span><span class="pill w">W 68</span></div>`;
}
function toast(msg) {
  state.toast = msg; render();
  setTimeout(() => { if (state.toast === msg) { state.toast = null; render(); } }, 2800);
}
function login() {
  state.user = { name: "0xMaya", handle: "maya-eth" };
  toast("Your last three deploys are already on a card. Claimed.");
  render();
}
function publishDeploy() {
  state.unpublished = false; state.published = true;
  if (!state.tasks.shipped.find((t) => t.id === "t-deploy")) {
    state.tasks.shipped.unshift({ id: "t-deploy", title: "v2.1.0 deploy", who: "Maya" });
  }
  state.modal = null; state.nav = "home"; state.phoneTab = "feed";
  toast("Ship Event live. Watchers will get a push.");
  render();
}
function events() {
  const live = [];
  if (state.published) {
    live.push({ id: "e-deploy", verb: "DEPLOYED", kind: "deploy", title: "vault-v2 is live on Base", who: "0xMaya · Harbor", when: "just now", body: "14,102 tests · Spearbit attached · three prior products still alive", proof: "0x4f2a…91c  ·  tag v2.1.0  ·  BaseScan  ·  Harbor/vault" });
  }
  return live.concat(eventsSeed);
}
function bar(label, val, color) {
  return `<div class="bar-row"><span>${label}</span><div class="track"><div class="fill" style="width:${val}%;background:${color}"></div></div><span>${val}</span></div>`;
}
function eventCard(ev) {
  const collected = state.collects.has(ev.id);
  return `<article class="event"><div class="event-head"><span class="who">${ev.who} · ${ev.when}</span><span class="verb ${ev.kind}">${ev.verb}</span></div><h3>${ev.title}</h3><p class="sub" style="margin:0">${ev.body}</p><div class="proof">${ev.proof}</div>${scoresHtml()}<div class="actions"><button class="btn btn-primary btn-sm" data-act="collect" data-id="${ev.id}">${collected ? "Collected" : "Collect"}</button><button class="btn btn-outline btn-sm" data-act="watch">Watching</button><button class="btn btn-ghost btn-sm" data-act="dili">Diligence</button><button class="btn btn-ghost btn-sm" data-act="ship">Open ship</button></div></article>`;
}
function viewHome() {
  return `<div class="feed-layout"><div><h2 class="page">Home</h2><p class="sub">Ship Events from Watches. Not a timeline of gms.</p><div class="filters">${["watched","deploys","hiring","incidents"].map((f)=>`<button class="${state.filter===f?"on":""}" data-filter="${f}">${f}</button>`).join("")}</div>${events().map(eventCard).join("")}</div><aside><div class="side-card"><h4>LIVE HOUR</h4><p>${state.published?"1 deploy":"0 deploys"}<br>1 audit<br>1 open role</p></div><div class="side-card" style="margin-top:12px"><h4>YOUR QUEUE</h4><p>${state.unpublished?"1 unpublished deploy — vault-v2":"Queue clear."}</p>${state.unpublished?`<button class="btn btn-primary btn-sm" style="margin-top:10px" data-act="open-publish">Publish</button>`:""}</div></aside></div>`;
}
function viewYard() {
  if (state.yardTab !== "board") {
    const copy = {
      overview: "<h2 class='page'>Harbor · Overview</h2><div class='panel'><p>3 people online. Window: deploys + audits public.</p></div>",
      repos: "<h2 class='page'>Repos</h2><div class='panel'><strong>Harbor/vault</strong><p class='sub'>main · CI green · PR #88</p></div>",
      room: "<h2 class='page'>Room</h2><div class='panel'><p>Maya: invariants green.</p><p>Kade: tagging v2.1.0.</p></div>",
      window: "<h2 class='page'>Window rules</h2><div class='panel'><p>Deploys public. Merges private.</p></div>",
      people: "<h2 class='page'>People</h2><div class='crew-row'><div class='mini'>Maya · lead</div><div class='mini'>Kade · contracts</div><div class='mini'>Rin · design</div></div>"
    };
    return copy[state.yardTab] || copy.overview;
  }
  const cols = [["icebox","ICEBOX"],["now","NOW"],["review","REVIEW"],["shipped","SHIPPED"]];
  return `<h2 class="page">Harbor · Board</h2><p class="sub">Drag a card into Shipped to publish.</p><div class="board">${cols.map(([key,label])=>`<div class="col" data-col="${key}"><h4>${label}</h4>${state.tasks[key].map((t)=>`<div class="task ${key==="shipped"?"shipped":""}" draggable="true" data-task="${t.id}" data-from="${key}"><h5>${t.title}</h5><span>${t.who}</span></div>`).join("")}${key==="shipped"&&state.unpublished?`<button class="btn btn-outline btn-sm" data-act="open-publish">Publish v2.1.0</button>`:""}</div>`).join("")}</div>`;
}
function viewShip() {
  return `<h2 class="page">vault-v2</h2><p class="sub">Harbor · Base · ${state.published?"Mainnet · Alive":"Ready to ship"}</p><div class="stage">${["Idea","Private","Testnet","Audit","Mainnet","Alive"].map((s,i)=>`<span class="${(state.published&&i>=4)||(!state.published&&i===3)?"on":""}">${s}</span>`).join("")}</div><div class="crew-row"><div class="mini">Maya · lead</div><div class="mini">Kade · contracts</div><div class="mini">Rin · design</div></div><div class="split"><div class="panel"><h4 style="color:var(--acc);font-size:11px">CONTRACTS</h4><p>Vault 0x4f2a…91c verified</p><p>Factory 0x88c1…0aa verified</p></div><div>${events().filter((e)=>e.kind!=="role").map(eventCard).join("")||"<div class='panel'><p>Window quiet until you publish.</p></div>"}</div></div>`;
}
function viewCard() {
  return `<div class="claim">GitHub maya-eth linked. 3 verified deploys backfilled.</div><div class="bcard"><div class="event-head"><strong>0xMaya</strong><span class="chip gold">OPEN TO CREW</span></div><p class="sub">Solidity · Harbor · Base / ETH</p><div class="bars">${bar("SHIP",72,"var(--ship)")}${bar("CRAFT",64,"var(--craft)")}${bar("CREW",51,"var(--crew)")}${bar("WORD",68,"var(--word)")}</div><p class="sub">LAST SHIPS</p><p>vault-v2 · Base · ${state.published?"alive":"queued"}</p><p>hook-router · Arb · alive 186d</p><p>points-lens · ETH · sunset</p><p style="color:var(--acc);margin-top:10px">3 alive · 0 rugged · no follower count</p></div>`;
}
function viewPeople() { return `<h2 class="page">People</h2><p class="sub">Sorted by delivery, not followers.</p>${viewCard()}`; }
function viewLaunch() {
  return `<h2 class="page">Launch</h2><p class="sub">Collect or join this week. Nothing tradable in slice 1.</p><div class="panel"><h3>vault-v2 genesis</h3><p class="sub">${state.published?"Open — proof of presence.":"Opens when the deploy is published."}</p><button class="btn btn-primary btn-sm" data-act="collect" data-id="e-deploy" ${state.published?"":"disabled"}>Collect</button></div>`;
}
function viewDili() {
  return `<h2 class="page">Diligence · vault-v2</h2><p class="sub">Living one-pager for a fund meeting.</p><div class="split"><div class="panel"><h4 style="color:var(--acc);font-size:11px">CREW</h4><p>Maya, Kade, Rin. Shipped twice. No rug.</p></div><div class="panel"><h4 style="color:var(--acc);font-size:11px">PRIOR SHIPS</h4><p>hook-router alive 186d. 0 rugged.</p></div><div class="panel"><h4 style="color:var(--acc);font-size:11px">AUDITS</h4><p>Spearbit vault-v2. 12 findings closed.</p></div><div class="panel"><h4 style="color:var(--acc);font-size:11px">SAFE</h4><p>3 of 5. Named signers.</p></div></div>`;
}
function viewMsgs() { return `<h2 class="page">Messages</h2><div class="panel"><p>Kade: tagging after lunch.</p></div>`; }
function viewWatch() {
  return `<h2 class="page">Watch</h2><p class="sub">Ships as matches.</p><div class="panel"><strong>vault-v2</strong><p class="sub">${state.published?"● live on Base":"● queued deploy"}</p></div><div class="panel"><strong>hook-router</strong><p class="sub">● live on Arbitrum</p></div>`;
}
const views = { home: viewHome, yard: viewYard, ships: viewShip, people: viewPeople, launch: viewLaunch, diligence: viewDili, messages: viewMsgs, me: viewCard, watch: viewWatch, card: viewCard, crew: () => `<h2 class="page">Crew</h2><div class="panel"><p>Harbor · you are lead.</p></div>` };
function drawerHtml() {
  if (state.unpublished) return `<h3>UNPUBLISHED</h3><p>Verified deploy matched to Harbor/vault v2.1.0 on Base.</p><ul><li>Harbor Safe deployer</li><li>CI artifact match</li></ul><button class="btn btn-primary" data-act="open-publish">Publish Ship Event</button>`;
  return `<h3>PROOF</h3><p>Last event is on the feed.</p><ul><li>0x4f2a…91c</li><li>tag v2.1.0</li></ul>`;
}
function render() {
  const app = $("#app"); const gate = $("#gate");
  if (!state.user) { app.classList.add("hidden"); gate.classList.remove("hidden"); return; }
  gate.classList.add("hidden"); app.classList.remove("hidden");
  const phone = window.matchMedia("(max-width: 900px)").matches;
  const view = phone ? state.phoneTab : state.nav;
  $("#inner-nav").classList.toggle("hidden", !( !phone && state.nav === "yard"));
  $$("#inner-nav button").forEach((b) => b.classList.toggle("on", b.dataset.yard === state.yardTab));
  $$(".rail button[data-nav]").forEach((b) => b.classList.toggle("on", b.dataset.nav === state.nav));
  $$(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.phone === state.phoneTab));
  const chip = $("#queue-chip");
  if (state.unpublished) { chip.classList.remove("hidden"); chip.textContent = "Unpublished deploy · vault-v2"; }
  else chip.classList.add("hidden");
  $("#canvas").innerHTML = (views[view] || viewHome)();
  $("#drawer").innerHTML = drawerHtml();
  const toastEl = $("#toast");
  if (state.toast) { toastEl.textContent = state.toast; toastEl.classList.remove("hidden"); }
  else toastEl.classList.add("hidden");
  $("#modal-bg").classList.toggle("hidden", state.modal !== "publish");
}
function moveTask(id, from, to) {
  const list = state.tasks[from]; const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const [task] = list.splice(idx, 1); state.tasks[to].push(task);
  if (to === "shipped" && state.unpublished) state.modal = "publish";
  render();
}
function onClick(e) {
  const nav = e.target.closest("[data-nav]");
  if (nav) { state.nav = nav.dataset.nav; render(); return; }
  const phone = e.target.closest("[data-phone]");
  if (phone) { state.phoneTab = phone.dataset.phone; render(); return; }
  const yard = e.target.closest("[data-yard]");
  if (yard) { state.yardTab = yard.dataset.yard; render(); return; }
  const filter = e.target.closest("[data-filter]");
  if (filter) { state.filter = filter.dataset.filter; render(); return; }
  const act = e.target.closest("[data-act]"); if (!act) return;
  const a = act.dataset.act;
  if (a === "collect") { if (!state.published && act.dataset.id === "e-deploy") return toast("Publish the deploy first."); state.collects.add(act.dataset.id || "e-deploy"); toast("Genesis badge in your tray."); render(); }
  else if (a === "watch") { state.watches.add("vault-v2"); toast("Watching vault-v2."); render(); }
  else if (a === "dili") { state.nav = "diligence"; state.phoneTab = "launch"; render(); }
  else if (a === "ship") { state.nav = "ships"; state.phoneTab = "watch"; render(); }
  else if (a === "open-publish") { state.modal = "publish"; render(); }
  else if (a === "confirm-publish") publishDeploy();
  else if (a === "cancel") { state.modal = null; render(); }
}
document.addEventListener("dragstart", (e) => { const t = e.target.closest(".task"); if (!t) return; e.dataTransfer.setData("text/plain", JSON.stringify({ id: t.dataset.task, from: t.dataset.from })); });
document.addEventListener("dragover", (e) => { if (e.target.closest(".col")) e.preventDefault(); });
document.addEventListener("drop", (e) => { const col = e.target.closest(".col"); if (!col) return; e.preventDefault(); const data = JSON.parse(e.dataTransfer.getData("text/plain")); moveTask(data.id, data.from, col.dataset.col); });
window.addEventListener("resize", () => { if (state.user) render(); });
document.addEventListener("DOMContentLoaded", () => {
  $("#btn-gh").addEventListener("click", login);
  $("#btn-wallet").addEventListener("click", login);
  $("#btn-apple").addEventListener("click", login);
  document.addEventListener("click", onClick);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  render();
});
