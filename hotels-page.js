(() => {
  function appIsReady() {
    return typeof databaseOrder !== "undefined"
      && typeof databaseConfig !== "undefined"
      && typeof databases !== "undefined"
      && typeof state !== "undefined"
      && typeof render === "function"
      && typeof getDatabaseFromHash === "function";
  }

  function normalizedWeddingRows() {
    return (window.WEDDING_DATA || []).map((row) => ({
      ...row,
      type: Array.isArray(row.style_tags) ? row.style_tags.join(", ") : row.region || "",
      capacity: row.aesthetic_notes || "",
    }));
  }

  function installHotelsDatabase() {
    if (!appIsReady()) return;

    const reordered = ["reading", "recipes", "media", "hotels", "restaurants", "wedding", "wardrobe", "flowers", "sake"];
    databaseOrder.splice(0, databaseOrder.length, ...reordered.filter((name) => databaseOrder.includes(name) || name === "hotels"));

    databaseConfig.hotels = {
      title: "Hotels",
      search: "Search hotels",
      source: "Saved hotel collection",
      filterKey: "status",
      allLabel: "all hotels",
      dateKey: "visited_on",
      createdKey: "created_at",
      primaryKey: "name",
      columns: [
        { label: "Hotel", key: "name", primary: true },
        { label: "Location", key: "location", detail: true },
        { label: "Status", key: "status", format: "label", mobile: false },
        { label: "Visited", key: "displayDate", mobile: false },
        { label: "", key: "website", link: true },
      ],
    };

    databases.hotels = window.HOTELS_DATA || [];

    if (window.WEDDING_DATA) {
      databases.wedding = normalizedWeddingRows();
      databaseConfig.wedding.source = "Saved wedding venue data";
    }

    if (typeof liveDatabaseNames !== "undefined") {
      liveDatabaseNames.delete("hotels");
      liveDatabaseNames.delete("wedding");
    }
  }

  function syncCurrentRoute() {
    if (!appIsReady()) return;
    installHotelsDatabase();

    const database = getDatabaseFromHash();
    if (state.database !== database) {
      state.database = database;
      state.filters = {};
      state.search = "";
      const searchInput = document.querySelector("#searchInput");
      if (searchInput) searchInput.value = "";
    }

    render();
  }

  installHotelsDatabase();
  syncCurrentRoute();

  window.addEventListener("hashchange", () => {
    setTimeout(syncCurrentRoute, 0);
  });
})();
