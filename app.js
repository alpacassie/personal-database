const databaseOrder = ["reading", "recipes", "media", "wardrobe", "wedding", "flowers", "sake"];

const liveDatabaseNames = new Set(databaseOrder);
const liveDatabaseEndpoint = "https://dxgfcxdlxuruvdyaulfj.supabase.co/functions/v1/public-databases";
const supabasePublishableKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z2ZjeGRseHVydXZkeWF1bGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTQ0MTgsImV4cCI6MjA4MzEzMDQxOH0.PDLsQxbE5rPOs4-IR64UYAjinihyys8ASPibMQhjJK0";

const databaseConfig = {
  reading: {
    title: "Reading",
    search: "Search titles",
    source: "Live from Supabase · notes excluded",
    filterKey: "category",
    allLabel: "all files",
    dateKey: "date",
    createdKey: "created_at",
    primaryKey: "title",
    columns: [
      { label: "Title", key: "title", primary: true },
      { label: "Type", key: "category", mobile: false, format: "label" },
      { label: "Added", key: "displayDate", mobile: false },
      { label: "", key: "link", link: true },
    ],
  },
  recipes: {
    title: "Recipes",
    search: "Search recipes or ingredients",
    source: "Live from Supabase",
    primaryKey: "name",
    columns: [
      { label: "Recipe", key: "name", primary: true },
      { label: "Ingredients & notes", key: "details", detail: true },
    ],
  },
  media: {
    title: "Media",
    search: "Search media",
    source: "Live from Supabase",
    filterKey: "type",
    allLabel: "all media",
    dateKey: "watched",
    createdKey: "created_at",
    primaryKey: "name",
    columns: [
      { label: "Title", key: "name", primary: true },
      { label: "Type", key: "type", format: "label" },
      { label: "Watched", key: "displayDate", mobile: false },
      { label: "", key: "link", link: true },
    ],
  },
  wardrobe: {
    title: "Wardrobe",
    search: "Search wardrobe",
    source: "Live from Supabase",
    filters: [
      {
        label: "Season",
        key: "season",
        allLabel: "All",
        values: [{ value: "summer", label: "Summer" }],
      },
      {
        label: "Capsule",
        key: "capsule",
        allLabel: "All",
        values: [{ value: "true", label: "Core" }],
      },
    ],
    primaryKey: "name",
    columns: [
      { label: "Item", key: "name", primary: true, wardrobeItem: true },
      { label: "Type", key: "wardrobeType", format: "label" },
      { label: "Brand", key: "brand", detail: true },
      { label: "", key: "wardrobeZoom", zoom: true },
    ],
  },
  wedding: {
    title: "Wedding",
    search: "Search venues",
    source: "Live from Supabase",
    filterKey: "status",
    allLabel: "all statuses",
    dateKey: "created_at",
    primaryKey: "name",
    columns: [
      { label: "Venue", key: "name", primary: true },
      { label: "Location", key: "location" },
      { label: "Type", key: "type", mobile: false, detail: true },
      { label: "Capacity", key: "capacity", mobile: false, detail: true },
      { label: "Status", key: "status", format: "label" },
      { label: "", key: "website", link: true },
    ],
  },
  flowers: {
    title: "Flowers",
    search: "Search flowers",
    source: "Live from Supabase",
    filterKey: "tone",
    allLabel: "all flowers",
    dateKey: "collected_on",
    createdKey: "created_at",
    primaryKey: "name",
    columns: [
      { label: "Flower", key: "name", primary: true },
      { label: "Latin name", key: "latin", detail: true },
      { label: "Tone", key: "tone", mobile: false, format: "label" },
      { label: "Collected", key: "displayDate", mobile: false },
      { label: "Note", key: "note", mobile: false, detail: true },
    ],
  },
  sake: {
    title: "Sake",
    search: "Search sake",
    source: "Live from Supabase",
    dateKey: "date",
    createdKey: "created_at",
    primaryKey: "name",
    columns: [
      { label: "Name", key: "name", primary: true },
      { label: "Tasted", key: "displayDate" },
    ],
  },
};

const collectionData = window.COLLECTION_DATA || {};
const savedWardrobeRows = window.WARDROBE_DATA || collectionData.wardrobe || [];
const databases = {
  reading: window.READING_DATA || [],
  recipes: collectionData.recipes || [],
  media: collectionData.media || [],
  wardrobe: savedWardrobeRows,
  wedding: [],
  flowers: collectionData.flowers || [],
  sake: collectionData.sake || [],
};

const state = {
  database: getDatabaseFromHash(),
  filters: {},
  search: "",
  sort: "newest",
  wardrobeView: "board",
};

const liveState = {
  loading: new Set(),
  errors: {},
  fetchedAt: {},
};

const databaseNav = document.querySelector("#databaseNav");
const pageTitle = document.querySelector("#pageTitle");
const totalCount = document.querySelector("#totalCount");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const categoryTabs = document.querySelector("#categoryTabs");
const tableWrap = document.querySelector(".table-wrap");
const tableElement = tableWrap.querySelector("table");
const tableHead = document.querySelector("#tableHead");
const tableRows = document.querySelector("#tableRows");
const emptyState = document.querySelector("#emptyState");
const sourceNote = document.querySelector("#sourceNote");
const wardrobeBoard = document.createElement("div");
const zoomDialog = document.createElement("div");

wardrobeBoard.className = "wardrobe-board";
wardrobeBoard.hidden = true;
tableWrap.append(wardrobeBoard);

zoomDialog.className = "image-zoom";
zoomDialog.hidden = true;
zoomDialog.innerHTML = `
  <button class="image-zoom__backdrop" type="button" aria-label="Close image preview"></button>
  <figure class="image-zoom__figure" role="dialog" aria-modal="true" aria-label="Wardrobe image preview">
    <button class="image-zoom__close" type="button" aria-label="Close image preview">&times;</button>
    <img alt="" />
    <figcaption></figcaption>
  </figure>
`;
document.body.append(zoomDialog);

const zoomImage = zoomDialog.querySelector("img");
const zoomCaption = zoomDialog.querySelector("figcaption");
const zoomCloseButtons = zoomDialog.querySelectorAll("button");

function getDatabaseFromHash() {
  const name = window.location.hash.replace("#", "");
  return databaseOrder.includes(name) ? name : "reading";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLabel(value = "") {
  return String(value).replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

const wardrobeIconColors = [
  ["black", "#2d2d2d"],
  ["navy", "#1f3458"],
  ["blue stripe", "#cfe0f4"],
  ["rivera stripe", "#cfe0f4"],
  ["sky blue", "#b9d5ee"],
  ["blue", "#9eb8dd"],
  ["white", "#f7f5ee"],
  ["salt white", "#f7f5ee"],
  ["cloud dancer", "#f5f0e6"],
  ["yellow", "#f4d670"],
  ["brown", "#8b6246"],
  ["ritual", "#9bb5ca"],
  ["dark denim", "#3b536b"],
  ["silver", "#c7c8d2"],
];

const wardrobeAssetIcons = {
  "black tank": "assets/wardrobe-icons/black-tank.png",
  "white tank": "assets/wardrobe-icons/white-tank.png",
  "black baby tee": "assets/wardrobe-icons/black-baby-tee.png",
  "white baby tee": "assets/wardrobe-icons/white-baby-tee.png",
  "yellow baby tee": "assets/wardrobe-icons/yellow-baby-tee.png",
  "black long sleeve": "assets/wardrobe-icons/black-long-sleeve.png",
  "blue strapless top": "assets/wardrobe-icons/blue-strapless-top.png",
  "blue striped button-down": "assets/wardrobe-icons/blue-striped-button-down.png",
  "blue striped shirt": "assets/wardrobe-icons/blue-striped-button-down.png",
  "white striped button-down": "assets/wardrobe-icons/white-striped-button-down.png",
  "navy long sleeve": "assets/wardrobe-icons/navy-long-sleeve.png",
  "white button-down": "assets/wardrobe-icons/white-button-down.png",
  "black pants": "assets/wardrobe-icons/black-pants.png",
  "blue jeans": "assets/wardrobe-icons/blue-jeans.png",
  "brown pants": "assets/wardrobe-icons/brown-pants.png",
  "white jeans": "assets/wardrobe-icons/white-jeans.png",
  "white linen pants": "assets/wardrobe-icons/white-linen-pants.png",
  "denim shorts": "assets/wardrobe-icons/denim-shorts.png",
  "white denim shorts": "assets/wardrobe-icons/white-denim-shorts.png",
  "black midi skirt": "assets/wardrobe-icons/black-midi-skirt.png",
  "blue midi skirt": "assets/wardrobe-icons/blue-midi-skirt.png",
  "dark denim jacket": "assets/wardrobe-icons/dark-denim-jacket.png",
  "black dress": "assets/wardrobe-icons/black-dress.png",
  "white dress": "assets/wardrobe-icons/white-dress.png",
  "black flats": "assets/wardrobe-icons/black-flats.png",
  "silver flats": "assets/wardrobe-icons/silver-flats.png",
  "black shoulder bag": "assets/wardrobe-icons/black-shoulder-bag.png",
  "brown quilted bag": "assets/wardrobe-icons/brown-quilted-bag.png",
  "brown knitwear jacket": "assets/wardrobe-icons/brown-knitwear-jacket.png",
};

const wardrobeRealPhotos = {
  "black tank": "assets/wardrobe-icons/real-black-tank.png",
  "blue strapless top": "assets/wardrobe-icons/real-blue-strapless-top.png",
  "blue striped button-down": "assets/wardrobe-icons/real-blue-striped-button-down.png",
  "blue striped shirt": "assets/wardrobe-icons/real-blue-striped-shirt.png",
  "white striped button-down": "assets/wardrobe-icons/real-blue-striped-shirt.png",
  "white button-down": "assets/wardrobe-icons/real-white-button-down.png",
  "black midi skirt": "assets/wardrobe-icons/real-black-midi-skirt.png",
  "white dress": "assets/wardrobe-icons/real-white-dress.png",
  "black flats": "assets/wardrobe-icons/real-black-flats.png",
};

const wardrobeIconAssetVersion = "2026-06-24-knitwear-bag";

const wardrobeBoardSections = [
  {
    label: "tops",
    rows: [
      ["black tank", "white tank", "black baby tee", "white baby tee"],
      ["blue striped shirt", "blue strapless top"],
    ],
  },
  {
    label: "bottoms",
    rows: [["white linen pants", "black midi skirt", "denim shorts", "white denim shorts"]],
  },
  {
    label: "dress / jackets",
    rows: [["black dress", "white dress", "dark denim jacket", "brown knitwear jacket"]],
  },
  {
    label: "shoes",
    rows: [["black flats", "silver flats"]],
  },
  {
    label: "bags",
    rows: [["black shoulder bag", "brown quilted bag"]],
  },
];

const wardrobeBoardDisplayNames = {
  "black midi skirt": "black skirt",
  "denim shorts": "jean shorts",
  "white denim shorts": "white jean shorts",
};

const wardrobeBoardMeta = {
  "black shoulder bag": { brand: "bag", category: "bag", season: "all-season", capsule: true, type_order: 6, subtype_order: 1 },
  "brown quilted bag": { brand: "bag", category: "bag", season: "all-season", capsule: true, type_order: 6, subtype_order: 1 },
  "brown knitwear jacket": { brand: "knitwear", category: "jacket", season: "all-season", capsule: true, type_order: 3, subtype_order: 1 },
};

const wardrobeBoardAssetOverrides = {
  "black tank": "assets/wardrobe-icons/real-black-tank.png",
  "blue striped shirt": "assets/wardrobe-icons/blue-striped-button-down.png",
};

const wardrobeBoardItemCount = wardrobeBoardSections.flatMap((section) => section.rows).flat().length;
const wardrobeBoardAssetVersion = "2026-06-24-knitwear-bag";
const wardrobeViewModes = [
  { value: "board", label: "Board" },
  { value: "table", label: "Table" },
];

function wardrobeColor(row) {
  const swatch = String(`${row.color || ""} ${row.name || ""}`).toLowerCase();
  return (wardrobeIconColors.find(([name]) => swatch.includes(name)) || [null, "#e9dfd7"])[1];
}

function wardrobeIconType(row) {
  const category = String(row.category || "").toLowerCase();
  const name = String(row.name || "").toLowerCase();
  if (category.includes("tank")) return "tank";
  if (category.includes("tee")) return "tee";
  if (category.includes("short")) return "shorts";
  if (category.includes("pants") || name.includes("jeans")) return "pants";
  if (category.includes("skirt")) return "skirt";
  if (category.includes("jacket")) return "jacket";
  if (category.includes("dress")) return "dress";
  if (category.includes("shoe") || name.includes("flat")) return "shoes";
  return "shirt";
}

function wardrobeTypeLabel(row) {
  if (row.type) return row.type;
  const typeOrder = Number(row.type_order);
  if (typeOrder === 1) return "top";
  if (typeOrder === 2) return "bottom";
  if (typeOrder === 3) return "outerwear";
  if (typeOrder === 4) return "dress";
  if (typeOrder === 5) return "shoes";
  return row.category || "";
}

function px(x, y, width, height, fill, extra = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
}

function wardrobeTableAsset(row) {
  const key = normalizeWardrobeName(row.name);
  return key === "black tank" ? wardrobeRealPhotos[key] : wardrobeAssetIcons[key];
}

function wardrobePixelIcon(row) {
  const asset = wardrobeTableAsset(row);
  if (!asset) return "";
  const imageSrc = `${asset}?v=${wardrobeIconAssetVersion}`;
  const isRealPhoto = imageSrc.includes("real-black-tank");
  return `<button class="pixel-icon wardrobe-image-icon ${isRealPhoto ? "real-photo" : ""}" type="button" title="Open ${escapeHtml(row.name)} image" aria-label="Open ${escapeHtml(row.name)} image" data-zoom-src="${escapeHtml(imageSrc)}" data-zoom-label="${escapeHtml(row.name)}"><img src="${escapeHtml(imageSrc)}" alt="" loading="lazy"></button>`;
}

function wardrobeZoomAttributes(row) {
  const asset = wardrobeTableAsset(row);
  if (!asset) return "";
  const imageSrc = `${asset}?v=${wardrobeIconAssetVersion}`;
  return `data-zoom-src="${escapeHtml(imageSrc)}" data-zoom-label="${escapeHtml(row.name)}"`;
}

function wardrobeItemCell(row) {
  return `<div class="wardrobe-item">${wardrobePixelIcon(row)}<span>${escapeHtml(row.name || "—")}</span></div>`;
}

function normalizeWardrobeName(name) {
  return String(name || "").toLowerCase();
}

function wardrobeBoardAsset(name) {
  const key = normalizeWardrobeName(name);
  return wardrobeBoardAssetOverrides[key] || wardrobeAssetIcons[key] || "";
}

function wardrobeBoardImage(row) {
  const asset = wardrobeBoardAsset(row.name);
  if (!asset) return "";
  const imageSrc = `${asset}?v=${wardrobeBoardAssetVersion}`;
  const isRealPhoto = imageSrc.includes("real-black-tank");
  return `<button class="wardrobe-board-piece ${isRealPhoto ? "real-photo" : ""}" type="button" data-zoom-src="${escapeHtml(imageSrc)}" data-zoom-label="${escapeHtml(row.displayName)}">
    <img src="${escapeHtml(imageSrc)}" alt="" loading="lazy">
    <span class="wardrobe-board-piece-name">${escapeHtml(row.displayName)}</span>
    <span class="wardrobe-board-piece-meta">${escapeHtml(row.brand || "—")}</span>
  </button>`;
}

function wardrobeBoardRows(rows) {
  const byName = new Map(rows.map((row) => [normalizeWardrobeName(row.name), row]));
  return wardrobeBoardSections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => row.map((name) => {
      const key = normalizeWardrobeName(name);
      const source = byName.get(key) || { name };
      return {
        ...source,
        displayName: wardrobeBoardDisplayNames[key] || source.name || name,
        name: source.name || name,
      };
    })),
  }));
}

function wardrobeBoardSourceRows(rows) {
  const byName = new Map();
  [...savedWardrobeRows, ...rows].forEach((row) => {
    byName.set(normalizeWardrobeName(row.name), row);
  });
  wardrobeBoardSections.flatMap((section) => section.rows).flat().forEach((name) => {
    const key = normalizeWardrobeName(name);
    if (!byName.has(key)) byName.set(key, { name, ...(wardrobeBoardMeta[key] || {}) });
  });
  return [...byName.values()];
}

function preparedRows() {
  const config = databaseConfig[state.database];
  return databases[state.database].map((row) => ({
    ...row,
    displayDate: formatDate(row[config.dateKey] || row[config.createdKey]),
    wardrobeType: state.database === "wardrobe" ? wardrobeTypeLabel(row) : row.wardrobeType,
  }));
}

function renderDatabaseNav() {
  databaseNav.innerHTML = databaseOrder.map((name) => `
    <a class="database-link ${state.database === name ? "active" : ""}" href="#${name}">${databaseConfig[name].title}</a>
  `).join("");
}

function filterValues(rows, key) {
  if (!key) return [];
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function renderFilters(rows) {
  const config = databaseConfig[state.database];
  const filters = config.filters || (config.filterKey ? [{ key: config.filterKey, allLabel: config.allLabel }] : []);
  const visibleFilters = filters;
  categoryTabs.hidden = visibleFilters.length === 0 && state.database !== "wardrobe";
  const wardrobeViewToggle = state.database === "wardrobe" ? `
    <div class="wardrobe-view-toggle" aria-label="Wardrobe views">
      ${wardrobeViewModes.map((mode) => `
        <button class="tab view-tab ${state.wardrobeView === mode.value ? "active" : ""}" type="button" data-wardrobe-view="${mode.value}">${mode.label}</button>
      `).join("")}
    </div>
  ` : "";
  categoryTabs.innerHTML = `${wardrobeViewToggle}${visibleFilters.map((filter) => {
    const values = filter.values || filterValues(rows, filter.key).map((value) => ({ value: String(value), label: formatLabel(value) }));
    const active = state.filters[filter.key] || "all";
    const buttons = [{ value: "all", label: filter.allLabel }, ...values].map(({ value, label }) =>
      `<button class="tab ${active === value ? "active" : ""}" data-filter-key="${escapeHtml(filter.key)}" data-filter-value="${escapeHtml(value)}" type="button">${escapeHtml(label)}</button>`
    ).join("");
    return `<div class="filter-group">${filter.label ? `<span class="filter-label">${escapeHtml(filter.label)}</span>` : ""}<div class="filter-options">${buttons}</div></div>`;
  }).join("")}`;

  categoryTabs.querySelectorAll("[data-wardrobe-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.wardrobeView = button.dataset.wardrobeView;
      render();
    });
  });

  categoryTabs.querySelectorAll("[data-filter-key]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters[button.dataset.filterKey] = button.dataset.filterValue;
      render();
    });
  });
}

function visibleRows(rows) {
  const config = databaseConfig[state.database];
  const query = state.search.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    const filters = config.filters || (config.filterKey ? [{ key: config.filterKey }] : []);
    const matchesFilter = filters.every(({ key }) => {
      const selected = state.filters[key] || "all";
      return selected === "all" || String(row[key]) === selected;
    });
    const matchesSearch = !query || Object.values(row).filter(Boolean).join(" ").toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return filtered.sort((a, b) => {
    const primaryA = String(a[config.primaryKey] || "");
    const primaryB = String(b[config.primaryKey] || "");
    if (state.database === "wardrobe" && state.sort === "newest") {
      const orderA = Number(a.type_order || 999);
      const orderB = Number(b.type_order || 999);
      const subOrderA = Number(a.subtype_order || 999);
      const subOrderB = Number(b.subtype_order || 999);
      return orderA - orderB || subOrderA - subOrderB || primaryA.localeCompare(primaryB);
    }
    if (state.sort === "az") return primaryA.localeCompare(primaryB);
    if (state.sort === "za") return primaryB.localeCompare(primaryA);
    const dateA = new Date(a[config.dateKey] || a[config.createdKey] || 0).getTime();
    const dateB = new Date(b[config.dateKey] || b[config.createdKey] || 0).getTime();
    return state.sort === "oldest" ? dateA - dateB : dateB - dateA;
  });
}

function openImageZoom(src, label) {
  zoomImage.src = src;
  zoomImage.alt = label;
  zoomImage.classList.toggle("real-photo", src.includes("real-black-tank"));
  zoomCaption.textContent = label;
  zoomDialog.hidden = false;
  document.body.classList.add("zoom-open");
  zoomDialog.querySelector(".image-zoom__close").focus();
}

function closeImageZoom() {
  zoomDialog.hidden = true;
  document.body.classList.remove("zoom-open");
  zoomImage.removeAttribute("src");
  zoomImage.classList.remove("real-photo");
}

function renderTable(rows) {
  const config = databaseConfig[state.database];
  if (state.database === "wardrobe" && state.wardrobeView !== "table") {
    const boardSourceRows = wardrobeBoardSourceRows(rows);
    const visible = visibleRows(boardSourceRows);
    tableElement.hidden = true;
    tableWrap.classList.add("wardrobe-board-wrap");
    wardrobeBoard.hidden = false;
    const visibleNames = new Set(visible.map((row) => normalizeWardrobeName(row.name)));
    const sections = wardrobeBoardRows(boardSourceRows).map((section) => ({
      ...section,
      rows: section.rows.map((row) => row.filter((item) => visibleNames.has(normalizeWardrobeName(item.name)))).filter((row) => row.length > 0),
    })).filter((section) => section.rows.length > 0);
    totalCount.textContent = sections.reduce((total, section) => total + section.rows.reduce((rowTotal, row) => rowTotal + row.length, 0), 0);
    emptyState.hidden = sections.length > 0;
    wardrobeBoard.innerHTML = sections.length > 0 ? `
      <div class="wardrobe-board-head">
        <div class="wardrobe-board-label">Section</div>
        <div class="wardrobe-board-note">
          <strong>Image layout</strong>
          <span>Grouped by outfit layer</span>
        </div>
      </div>
      ${sections.map((section) => `
        <section class="wardrobe-board-section" aria-label="${escapeHtml(section.label)}">
          <div class="wardrobe-board-section-label">${escapeHtml(section.label)}</div>
          <div class="wardrobe-board-rows">
            ${section.rows.map((row) => `<div class="wardrobe-board-row">${row.map(wardrobeBoardImage).join("")}</div>`).join("")}
          </div>
        </section>
      `).join("")}
    ` : "";
    return;
  }

  tableElement.hidden = false;
  tableWrap.classList.remove("wardrobe-board-wrap");
  wardrobeBoard.hidden = true;
  wardrobeBoard.innerHTML = "";
  const visible = visibleRows(rows);
  if (state.database === "wardrobe") totalCount.textContent = rows.length;
  tableHead.innerHTML = `<tr>${config.columns.map((column) => `
    <th class="${column.mobile === false ? "hide-mobile" : ""}" scope="col">${escapeHtml(column.label)}</th>
  `).join("")}</tr>`;

  emptyState.hidden = visible.length > 0;
  tableRows.innerHTML = visible.map((row) => `<tr>${config.columns.map((column) => {
    const classes = [column.primary ? "primary-cell" : "", column.detail ? "detail-cell" : "", column.key === "displayDate" ? "date-cell" : "", column.mobile === false ? "hide-mobile" : ""].filter(Boolean).join(" ");
    const raw = row[column.key];
    if (column.link) {
      return `<td>${raw ? `<a class="open-link" href="${escapeHtml(raw)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(row[config.primaryKey])}">↗</a>` : `<span class="no-link-mark">—</span>`}</td>`;
    }
    if (column.icon) {
      return `<td class="icon-cell">${state.database === "wardrobe" ? wardrobePixelIcon(row) : ""}</td>`;
    }
    if (column.wardrobeItem) {
      return `<td class="${classes}">${wardrobeItemCell(row)}</td>`;
    }
    if (column.zoom) {
      const zoomAttributes = wardrobeZoomAttributes(row);
      return `<td class="zoom-cell">${zoomAttributes ? `<button class="open-link wardrobe-zoom-link" type="button" aria-label="Open ${escapeHtml(row[config.primaryKey])} image" ${zoomAttributes}>↗</button>` : ""}</td>`;
    }
    const value = column.format === "label" ? formatLabel(raw || "—") : (raw || "—");
    return `<td class="${classes}">${escapeHtml(value)}</td>`;
  }).join("")}</tr>`).join("");
}

function render() {
  const config = databaseConfig[state.database];
  const rows = preparedRows();
  document.body.dataset.database = state.database;
  tableWrap.dataset.database = state.database;
  document.title = `${config.title} · Cassie's Databases`;
  pageTitle.textContent = config.title;
  totalCount.textContent = rows.length;
  if (liveDatabaseNames.has(state.database)) {
    if (liveState.loading.has(state.database) && rows.length === 0) {
      sourceNote.textContent = "Loading live data from Supabase…";
    } else if (liveState.errors[state.database]) {
      sourceNote.textContent = rows.length > 0 ? "Live connection unavailable · showing saved data" : "Unable to load Supabase data";
    } else {
      sourceNote.textContent = `${config.source} · refreshes automatically`;
    }
  } else {
    sourceNote.textContent = config.source;
  }
  searchInput.placeholder = config.search;
  renderDatabaseNav();
  renderFilters(rows);
  renderTable(rows);
}

async function refreshLiveDatabase(name, { silent = false } = {}) {
  if (!liveDatabaseNames.has(name) || liveState.loading.has(name)) return;
  liveState.loading.add(name);
  liveState.errors[name] = null;
  if (!silent && state.database === name) render();

  try {
    const response = await fetch(`${liveDatabaseEndpoint}?database=${encodeURIComponent(name)}`, {
      cache: "no-store",
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
      },
    });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.rows)) throw new Error("Supabase returned an invalid response");
    databases[name] = payload.rows;
    liveState.fetchedAt[name] = payload.fetchedAt || new Date().toISOString();
  } catch (error) {
    console.error(`Unable to refresh ${name}`, error);
    liveState.errors[name] = true;
  } finally {
    liveState.loading.delete(name);
    if (state.database === name) render();
  }
}

window.addEventListener("hashchange", () => {
  state.database = getDatabaseFromHash();
  state.filters = {};
  state.search = "";
  searchInput.value = "";
  render();
  refreshLiveDatabase(state.database);
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  render();
});

tableRows.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-zoom-src]");
  if (!trigger) return;
  openImageZoom(trigger.dataset.zoomSrc, trigger.dataset.zoomLabel || "Wardrobe image");
});

tableWrap.addEventListener("click", (event) => {
  if (event.target.closest("tbody")) return;
  const trigger = event.target.closest("[data-zoom-src]");
  if (!trigger) return;
  openImageZoom(trigger.dataset.zoomSrc, trigger.dataset.zoomLabel || "Wardrobe image");
});

zoomCloseButtons.forEach((button) => {
  button.addEventListener("click", closeImageZoom);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !zoomDialog.hidden) closeImageZoom();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  render();
});

document.querySelector("#backToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

render();
refreshLiveDatabase(state.database);

setInterval(() => refreshLiveDatabase(state.database, { silent: true }), 30_000);
window.addEventListener("focus", () => refreshLiveDatabase(state.database, { silent: true }));
