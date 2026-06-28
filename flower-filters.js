(() => {
  const colorFilters = [
    { value: "pink", label: "Pink" },
    { value: "red", label: "Red" },
    { value: "orange", label: "Orange" },
    { value: "yellow", label: "Yellow" },
    { value: "white", label: "White" },
    { value: "purple", label: "Purple" },
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
  ];

  const colorKeywords = {
    pink: ["pink", "blush", "rose", "magenta", "coral", "peach"],
    red: ["red", "burgundy", "scarlet", "ruby", "crimson"],
    orange: ["orange", "coral", "peach", "rust", "tangerine", "burnt"],
    yellow: ["yellow", "gold", "golden", "lemon", "sun"],
    white: ["white", "cream", "creamy", "ivory"],
    purple: ["purple", "lavender", "lilac", "violet", "mauve"],
    blue: ["blue", "cobalt", "slate"],
    green: ["green", "eucalyptus", "foliage", "leaf", "leaves"],
  };

  function flowerMatchesColor(row, color) {
    const text = [row.tone, row.name, row.latin, row.note].filter(Boolean).join(" ").toLowerCase();
    return (colorKeywords[color] || [color]).some((keyword) => text.includes(keyword));
  }

  databaseConfig.flowers.filters = [
    {
      label: "Color",
      key: "flowerColor",
      allLabel: "all flowers",
      values: colorFilters,
      matches: flowerMatchesColor,
    },
  ];
  delete databaseConfig.flowers.filterKey;

  databaseConfig.flowers.columns = [
    { label: "Flower", key: "name", primary: true },
    { label: "Collected", key: "displayDate" },
    { label: "Where / note", key: "note", detail: true },
    { label: "Tone", key: "tone", mobile: false, format: "label" },
    { label: "Latin name", key: "latin", mobile: false, detail: true },
  ];

  visibleRows = function visibleRows(rows) {
    const config = databaseConfig[state.database];
    const query = state.search.trim().toLowerCase();
    const filters = config.filters || (config.filterKey ? [{ key: config.filterKey }] : []);
    const filtered = rows.filter((row) => {
      const matchesFilter = filters.every((filter) => {
        const selected = state.filters[filter.key] || "all";
        if (selected === "all") return true;
        if (typeof filter.matches === "function") return filter.matches(row, selected);
        return String(row[filter.key]) === selected;
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
  };

  render();
})();
