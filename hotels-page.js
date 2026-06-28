(() => {
  const databaseNav = document.querySelector("#databaseNav");
  const pageTitle = document.querySelector("#pageTitle");
  const totalCount = document.querySelector("#totalCount");
  const searchInput = document.querySelector("#searchInput");
  const sortSelect = document.querySelector("#sortSelect");
  const categoryTabs = document.querySelector("#categoryTabs");
  const tableWrap = document.querySelector(".table-wrap");
  const tableElement = tableWrap?.querySelector("table");
  const tableHead = document.querySelector("#tableHead");
  const tableRows = document.querySelector("#tableRows");
  const emptyState = document.querySelector("#emptyState");
  const sourceNote = document.querySelector("#sourceNote");

  const state = {
    hotels: { filter: "all" },
    wedding: { filter: "all" },
  };

  const pages = {
    hotels: {
      title: "Hotels",
      hash: "#hotels",
      navAfter: "#wedding",
      navLabel: "Hotels",
      rows: () => window.HOTELS_DATA || [],
      filterKey: "status",
      allLabel: "all hotels",
      search: "Search hotels",
      source: "Saved hotel collection",
      primaryKey: "name",
      dateKey: "visited_on",
      columns: [
        { label: "Hotel", key: "name", primary: true },
        { label: "Location", key: "location", detail: true },
        { label: "Status", key: "status", format: "label" },
        { label: "Visited", key: "visited_on", date: true, mobile: false },
        { label: "Notes", key: "notes", detail: true, mobile: false },
      ],
    },
    wedding: {
      title: "Wedding",
      hash: "#wedding",
      navLabel: "Wedding",
      rows: () => window.WEDDING_DATA || [],
      filterKey: "status",
      allLabel: "all statuses",
      search: "Search venues",
      source: "Saved wedding venue data",
      primaryKey: "name",
      dateKey: "created_at",
      columns: [
        { label: "Venue", key: "name", primary: true },
        { label: "Location", key: "location" },
        { label: "Style", key: "style_tags", tags: true, mobile: false },
        { label: "Status", key: "status", format: "label" },
        { label: "Notes", key: "aesthetic_notes", detail: true, mobile: false },
        { label: "", key: "website", link: true },
      ],
    },
  };

  let rendering = false;

  function currentPageName() {
    return Object.keys(pages).find((name) => window.location.hash === pages[name].hash) || null;
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
    return String(value).replaceAll("_", " ").replaceAll("-", " ");
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
  }

  function dateScore(row, config) {
    const value = row[config.dateKey] || row.created_at;
    if (!value) return 0;
    const time = new Date(`${String(value).slice(0, 10)}T12:00:00`).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function addNavLinks() {
    if (!databaseNav) return;
    Object.entries(pages).forEach(([name, config]) => {
      let link = databaseNav.querySelector(`a[href="${config.hash}"]`);
      if (!link) {
        link = document.createElement("a");
        link.className = "database-link";
        link.href = config.hash;
        link.textContent = config.navLabel;
        const anchor = config.navAfter ? databaseNav.querySelector(`a[href="${config.navAfter}"]`) : null;
        if (anchor) anchor.after(link);
        else databaseNav.append(link);
      }
      link.classList.toggle("active", currentPageName() === name);
    });
  }

  function visibleRows(name) {
    const config = pages[name];
    const pageState = state[name];
    const query = searchInput.value.trim().toLowerCase();
    const rows = config.rows();
    const filtered = rows.filter((row) => {
      const matchesFilter = pageState.filter === "all" || row[config.filterKey] === pageState.filter;
      const matchesSearch = !query || Object.values(row).flat().filter(Boolean).join(" ").toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const primaryA = String(a[config.primaryKey] || "");
      const primaryB = String(b[config.primaryKey] || "");
      if (sortSelect.value === "az") return primaryA.localeCompare(primaryB);
      if (sortSelect.value === "za") return primaryB.localeCompare(primaryA);
      if (sortSelect.value === "oldest") return dateScore(a, config) - dateScore(b, config) || primaryA.localeCompare(primaryB);
      return dateScore(b, config) - dateScore(a, config) || primaryA.localeCompare(primaryB);
    });
  }

  function renderFilters(name) {
    const config = pages[name];
    const pageState = state[name];
    const values = [...new Set(config.rows().map((row) => row[config.filterKey]).filter(Boolean))].sort((a, b) => {
      if (a === "visited") return -1;
      if (b === "visited") return 1;
      return String(a).localeCompare(String(b));
    });
    const buttons = [{ value: "all", label: config.allLabel }, ...values.map((value) => ({ value, label: formatLabel(value) }))];

    categoryTabs.hidden = false;
    categoryTabs.innerHTML = `
      <div class="filter-group">
        <span class="filter-label">Filter</span>
        <div class="filter-options">
          ${buttons.map((button) => `<button class="tab ${pageState.filter === button.value ? "active" : ""}" data-custom-filter="${escapeHtml(button.value)}" type="button">${escapeHtml(button.label)}</button>`).join("")}
        </div>
      </div>
    `;
  }

  function renderCell(row, column, config) {
    const raw = row[column.key];
    const classes = [
      column.primary ? "primary-cell" : "",
      column.detail ? "detail-cell" : "",
      column.date ? "date-cell" : "",
      column.mobile === false ? "hide-mobile" : "",
    ].filter(Boolean).join(" ");

    if (column.link) {
      return `<td>${raw ? `<a class="open-link" href="${escapeHtml(raw)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(row[config.primaryKey])}">↗</a>` : `<span class="no-link-mark">—</span>`}</td>`;
    }
    if (column.tags) {
      const tags = Array.isArray(raw) ? raw : [];
      return `<td class="tag-cell ${column.mobile === false ? "hide-mobile" : ""}"><div class="tag-list">${tags.map((tag) => `<span>${escapeHtml(formatLabel(tag))}</span>`).join("")}</div></td>`;
    }
    const value = column.date ? formatDate(raw) : column.format === "label" ? formatLabel(raw || "—") : raw || "—";
    return `<td class="${classes}">${escapeHtml(value)}</td>`;
  }

  function renderCustomPage(force = false) {
    const name = currentPageName();
    addNavLinks();
    if (!name || rendering) return;

    const config = pages[name];
    const rows = visibleRows(name);
    const alreadyRendered = document.body.dataset.database === name && pageTitle.textContent === config.title;
    if (!force && alreadyRendered && Number(totalCount.textContent) === rows.length) return;

    rendering = true;
    document.body.dataset.database = name;
    tableWrap.dataset.database = name;
    tableWrap.classList.remove("wardrobe-board-wrap");
    tableElement.hidden = false;
    document.title = `${config.title} · Cassie's Databases`;
    pageTitle.textContent = config.title;
    totalCount.textContent = rows.length;
    searchInput.placeholder = config.search;
    sourceNote.textContent = config.source;

    renderFilters(name);
    tableHead.innerHTML = `<tr>${config.columns.map((column) => `<th class="${column.mobile === false ? "hide-mobile" : ""}" scope="col">${escapeHtml(column.label)}</th>`).join("")}</tr>`;
    emptyState.hidden = rows.length > 0;
    tableRows.innerHTML = rows.map((row) => `<tr>${config.columns.map((column) => renderCell(row, column, config)).join("")}</tr>`).join("");
    rendering = false;
  }

  window.addEventListener("hashchange", () => {
    const name = currentPageName();
    addNavLinks();
    if (!name) return;
    state[name].filter = "all";
    searchInput.value = "";
    setTimeout(() => renderCustomPage(true), 0);
    setTimeout(() => renderCustomPage(true), 250);
    setTimeout(() => renderCustomPage(true), 900);
  });

  searchInput.addEventListener("input", () => renderCustomPage(true));
  sortSelect.addEventListener("change", () => renderCustomPage(true));
  categoryTabs.addEventListener("click", (event) => {
    const name = currentPageName();
    const button = event.target.closest("[data-custom-filter]");
    if (!name || !button) return;
    state[name].filter = button.dataset.customFilter;
    renderCustomPage(true);
  });

  const observer = new MutationObserver(() => {
    if (!currentPageName() || rendering) return;
    setTimeout(() => renderCustomPage(true), 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  addNavLinks();
  renderCustomPage(true);
})();
