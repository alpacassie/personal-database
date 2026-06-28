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

  let hotelFilter = "all";

  function isHotelsPage() {
    return window.location.hash === "#hotels";
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

  function dateScore(row) {
    const value = row.visited_on || row.created_at;
    if (!value) return 0;
    const time = new Date(`${String(value).slice(0, 10)}T12:00:00`).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function addHotelNavLink() {
    if (!databaseNav) return;
    let hotelLink = databaseNav.querySelector('a[href="#hotels"]');
    if (!hotelLink) {
      hotelLink = document.createElement("a");
      hotelLink.className = "database-link";
      hotelLink.href = "#hotels";
      hotelLink.textContent = "Hotels";
      const weddingLink = databaseNav.querySelector('a[href="#wedding"]');
      if (weddingLink) weddingLink.after(hotelLink);
      else databaseNav.append(hotelLink);
    }

    databaseNav.querySelectorAll(".database-link").forEach((link) => {
      link.classList.toggle("active", isHotelsPage() && link.getAttribute("href") === "#hotels");
    });
  }

  function visibleHotelRows() {
    const query = searchInput.value.trim().toLowerCase();
    const rows = window.HOTELS_DATA || [];
    const filtered = rows.filter((row) => {
      const matchesFilter = hotelFilter === "all" || row.status === hotelFilter;
      const matchesSearch = !query || Object.values(row).filter(Boolean).join(" ").toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const nameA = String(a.name || "");
      const nameB = String(b.name || "");
      if (sortSelect.value === "az") return nameA.localeCompare(nameB);
      if (sortSelect.value === "za") return nameB.localeCompare(nameA);
      if (sortSelect.value === "oldest") return dateScore(a) - dateScore(b) || nameA.localeCompare(nameB);
      return dateScore(b) - dateScore(a) || nameA.localeCompare(nameB);
    });
  }

  function renderHotelFilters() {
    const rows = window.HOTELS_DATA || [];
    const statuses = [...new Set(rows.map((row) => row.status).filter(Boolean))].sort((a, b) => {
      if (a === "visited") return -1;
      if (b === "visited") return 1;
      return String(a).localeCompare(String(b));
    });
    const buttons = [{ value: "all", label: "all hotels" }, ...statuses.map((status) => ({ value: status, label: formatLabel(status) }))];

    categoryTabs.hidden = false;
    categoryTabs.innerHTML = `
      <div class="filter-group">
        <span class="filter-label">Status</span>
        <div class="filter-options">
          ${buttons.map((button) => `<button class="tab ${hotelFilter === button.value ? "active" : ""}" data-hotel-status="${escapeHtml(button.value)}" type="button">${escapeHtml(button.label)}</button>`).join("")}
        </div>
      </div>
    `;
  }

  function renderHotels() {
    if (!isHotelsPage()) {
      addHotelNavLink();
      return;
    }

    const rows = visibleHotelRows();
    document.body.dataset.database = "hotels";
    tableWrap.dataset.database = "hotels";
    tableWrap.classList.remove("wardrobe-board-wrap");
    tableElement.hidden = false;
    document.title = "Hotels · Cassie's Databases";
    pageTitle.textContent = "Hotels";
    totalCount.textContent = rows.length;
    searchInput.placeholder = "Search hotels";
    sourceNote.textContent = "Saved hotel collection";

    addHotelNavLink();
    renderHotelFilters();

    tableHead.innerHTML = `
      <tr>
        <th scope="col">Hotel</th>
        <th scope="col">Location</th>
        <th scope="col">Status</th>
        <th class="hide-mobile" scope="col">Visited</th>
        <th class="hide-mobile" scope="col">Notes</th>
      </tr>
    `;

    emptyState.hidden = rows.length > 0;
    tableRows.innerHTML = rows.map((row) => `
      <tr>
        <td class="primary-cell">${escapeHtml(row.name || "—")}</td>
        <td class="detail-cell">${escapeHtml(row.location || "—")}</td>
        <td>${escapeHtml(formatLabel(row.status || "—"))}</td>
        <td class="date-cell hide-mobile">${escapeHtml(formatDate(row.visited_on))}</td>
        <td class="detail-cell hide-mobile">${escapeHtml(row.notes || "—")}</td>
      </tr>
    `).join("");
  }

  window.addEventListener("hashchange", () => {
    addHotelNavLink();
    if (isHotelsPage()) {
      hotelFilter = "all";
      searchInput.value = "";
      renderHotels();
    }
  });

  searchInput.addEventListener("input", renderHotels);
  sortSelect.addEventListener("change", renderHotels);

  categoryTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hotel-status]");
    if (!button || !isHotelsPage()) return;
    hotelFilter = button.dataset.hotelStatus;
    renderHotels();
  });

  addHotelNavLink();
  if (isHotelsPage()) renderHotels();
  else setTimeout(addHotelNavLink, 0);
})();
