/**
 * Cursor Filter Query (Reference Only)
 * -----------------------------------
 * used in current implementation.
 * Keep as a short, readable reference.
 *
 * Prisma requirement:
 * @@unique([createdAt, id])
 * @@index([createdAt, id])
 */

export type CursorRef = { createdAt: Date; id: number };

export type Filter = {
  filters?: Record<string, any | any[] | null>;
  searchFilters?: Record<string, any | null>;
  rangedFilters?: { key: string; start: any; end: any }[];
  orderKey?: string;
  orderRule?: "asc" | "desc";
  rows?: number;
  page?: number;
  cursorCreatedAt?: string;
  cursorId?: number;
};

function isValidDate(dateString: any): boolean {
  if (typeof dateString !== "string") return false;
  const dateRegex = /^(?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z|\d{4}-\d{2}-\d{2})$/;
  return dateRegex.test(dateString);
}

function buildSearchQuery(searchFilters: Record<string, any | any[] | null>) {
  const whereClauseAndResult: any[] = [];
  const orQuerySearchArray: any[] = [];
  const isMultiKey = Object.values(searchFilters).length > 1;

  for (const key in searchFilters) {
    const valueToSearch = searchFilters[key];
    if (valueToSearch == null) continue;

    let searchQuery: any = {};
    if (key.includes(".")) {
      const [relation, column] = key.split(".");
      searchQuery = {
        [relation]: {
          [column]: { contains: valueToSearch }
        }
      };
      isMultiKey ? orQuerySearchArray.push(searchQuery) : whereClauseAndResult.push(searchQuery);
      continue;
    }

    searchQuery = { [key]: { contains: valueToSearch } };
    isMultiKey ? orQuerySearchArray.push(searchQuery) : whereClauseAndResult.push(searchQuery);
  }

  if (isMultiKey) {
    whereClauseAndResult.push({ OR: orQuerySearchArray });
  }

  return whereClauseAndResult;
}

function buildWhereQuery(filters: Record<string, any | any[] | null>) {
  const whereClauseAndResult: any[] = [];
  for (const key in filters) {
    const valueToFilter = filters[key];
    if (valueToFilter == null) continue;

    if (key.includes(".")) {
      const [relation, column] = key.split(".");
      if (Array.isArray(valueToFilter)) {
        const orQueryArray = valueToFilter.map((value) => ({
          [relation]: { [column]: value }
        }));
        whereClauseAndResult.push({ OR: orQueryArray });
      } else {
        whereClauseAndResult.push({ [relation]: { [column]: valueToFilter } });
      }
      continue;
    }

    if (Array.isArray(valueToFilter)) {
      const orQueryArray = valueToFilter.map((value) => ({ [key]: value }));
      whereClauseAndResult.push({ OR: orQueryArray });
    } else {
      whereClauseAndResult.push({ [key]: valueToFilter });
    }
  }

  return whereClauseAndResult;
}

function buildRangedFilter(rangedFilters: { key: string; start: any; end: any }[]) {
  const whereClauseAndResult: any[] = [];
  rangedFilters.forEach((range) => {
    const start = isValidDate(range.start) ? new Date(range.start) : range.start;
    const end = isValidDate(range.end) ? new Date(range.end) : range.end;
    whereClauseAndResult.push({ [range.key]: { gte: start, lte: end } });
  });
  return whereClauseAndResult;
}

export function buildCursorFilterQuery(filter: Filter, allowedSearchFields: string[]) {
  const query: any = { where: { AND: [] }, orderBy: {} };

  if (filter.filters) query.where.AND = buildWhereQuery(filter.filters);

  if (filter.searchFilters) {
    const allowed = new Set(allowedSearchFields);
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(filter.searchFilters)) {
      if (allowed.has(key)) sanitized[key] = filter.searchFilters[key];
    }
    query.where.AND = buildSearchQuery(sanitized).reduce((arr, v) => {
      arr.push(v);
      return arr;
    }, query.where.AND);
  }

  if (filter.rangedFilters) {
    query.where.AND = buildRangedFilter(filter.rangedFilters).reduce((arr, v) => {
      arr.push(v);
      return arr;
    }, query.where.AND);
  }

  if (filter.orderKey) query.orderBy = { [filter.orderKey]: filter.orderRule ?? "asc" };

  if (filter.cursorCreatedAt && filter.cursorId) {
    query.cursor = {
      createdAt_id: {
        createdAt: new Date(filter.cursorCreatedAt),
        id: filter.cursorId
      }
    };
    query.skip = 1;
  }

  query.take = (filter.rows ?? 10) + 1;
  return query;
}

// Composable builder (reference)
export function cursorFilterBuilder(filter: Filter, allowedSearchFields: string[]) {
  const state: any = { where: { AND: [] }, orderBy: {} };
  const rows = Number.isFinite(filter.rows) && (filter.rows as number) > 0 ? (filter.rows as number) : 10;

  const filters = () => {
    if (filter.filters) state.where.AND = buildWhereQuery(filter.filters);
    return api;
  };

  const search = () => {
    if (!filter.searchFilters) return api;
    const allowed = new Set(allowedSearchFields);
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(filter.searchFilters)) {
      if (allowed.has(key)) sanitized[key] = filter.searchFilters[key];
    }
    state.where.AND = buildSearchQuery(sanitized).reduce((arr, v) => {
      arr.push(v);
      return arr;
    }, state.where.AND);
    return api;
  };

  const range = () => {
    if (filter.rangedFilters) {
      state.where.AND = buildRangedFilter(filter.rangedFilters).reduce((arr, v) => {
        arr.push(v);
        return arr;
      }, state.where.AND);
    }
    return api;
  };

  const order = () => {
    if (filter.orderKey) state.orderBy = { [filter.orderKey]: filter.orderRule ?? "asc" };
    return api;
  };

  const cursor = () => {
    state.take = rows + 1;
    if (!filter.cursorId) return api;

    const orderKey = filter.orderKey ?? "id";
    if (orderKey === "id") {
      state.cursor = { id: filter.cursorId };
      state.skip = 1;
      return api;
    }

    if (filter.cursorCreatedAt) {
      state.cursor = {
        createdAt_id: {
          createdAt: new Date(filter.cursorCreatedAt),
          id: filter.cursorId
        }
      };
      state.skip = 1;
    }
    return api;
  };

  const offset = () => {
    const page = Number.isFinite(filter.page) && (filter.page as number) > 0 ? (filter.page as number) : 1;
    state.take = rows;
    state.skip = (page - 1) * rows;
    return api;
  };

  const build = () => state;

  const all = () => {
    filters();
    search();
    range();
    order();
    return api;
  };

  const api = { filters, search, range, order, cursor, offset, all, build };
  return api;
}
