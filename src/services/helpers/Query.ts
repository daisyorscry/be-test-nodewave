/**
 * Cursor Filter Query + Builder + Executor (FULL)
 * ----------------------------------------------
 * Goals:
 * 1) Keep behavior of your current query building (filters/search/range/order + offset/cursor)
 * 2) Add "executeOffset" and "executeCursor" so service doesn't need to think about:
 *    - Promise.all(list + count)
 *    - page/rows/totalPages
 *    - cursor response slicing + next/prev cursor
 *
 * Prisma note:
 * If you use composite cursor:
 *   @@unique([createdAt, id])
 *   @@index([createdAt, id])
 */

export type CursorRef = { createdAt: Date; id: number };
export type CursorMeta = { createdAt: string; id: number };

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

export type OffsetPaginationMeta = {
  page: number;
  rows: number;
  totalRows: number;
  totalPages: number;
};

export type OffsetResult<D> = {
  records: D[];
  pagination: OffsetPaginationMeta;
};

export type CursorResult<D> = {
  records: D[];
  nextCursor: CursorMeta | null;
  prevCursor: CursorMeta | null;
};

type OffsetMetaInternal = { page: number; rows: number };
type CursorMetaInternal = { rows: number };

const DATE_REGEX =
  /^(?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z|\d{4}-\d{2}-\d{2})$/;

function isValidDate(dateString: unknown): dateString is string {
  return typeof dateString === "string" && DATE_REGEX.test(dateString);
}

export function getLimit(filter?: { rows?: number }, fallback = 10) {
  return Number.isFinite(filter?.rows) && (filter?.rows as number) > 0
    ? (filter?.rows as number)
    : fallback;
}

function toPositiveInt(value: unknown, fallback: number) {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : fallback;
}

function appendAll(target: any[], items: any[]) {
  for (const it of items) target.push(it);
}

function sanitizeSearchFilters(
  searchFilters: Record<string, any | null>,
  allowedSearchFields: string[]
): Record<string, any> {
  const allowed = new Set(allowedSearchFields);
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(searchFilters)) {
    if (allowed.has(key)) sanitized[key] = searchFilters[key];
  }
  return sanitized;
}

function buildSearchQuery(searchFilters: Record<string, any | any[] | null>) {
  const whereClauseAndResult: any[] = [];
  const orQuerySearchArray: any[] = [];
  const isMultiKey = Object.values(searchFilters).length > 1;

  for (const key in searchFilters) {
    const valueToSearch = searchFilters[key];
    if (valueToSearch == null) continue;

    let searchQuery: any;

    if (key.includes(".")) {
      const [relation, column] = key.split(".");
      searchQuery = { [relation]: { [column]: { contains: valueToSearch } } };
      if (isMultiKey) orQuerySearchArray.push(searchQuery);
      else whereClauseAndResult.push(searchQuery);
      continue;
    }

    searchQuery = { [key]: { contains: valueToSearch } };
    if (isMultiKey) orQuerySearchArray.push(searchQuery);
    else whereClauseAndResult.push(searchQuery);
  }

  if (isMultiKey) whereClauseAndResult.push({ OR: orQuerySearchArray });

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
  for (const range of rangedFilters) {
    const start = isValidDate(range.start) ? new Date(range.start) : range.start;
    const end = isValidDate(range.end) ? new Date(range.end) : range.end;
    whereClauseAndResult.push({ [range.key]: { gte: start, lte: end } });
  }
  return whereClauseAndResult;
}

/**
 * Basic "one-shot" builder (kept)
 * - same behavior as your current "buildCursorFilterQuery"
 */
export function buildCursorFilterQuery(filter: Filter, allowedSearchFields: string[]) {
  const query: any = { where: { AND: [] as any[] }, orderBy: {} as any };

  if (filter.filters) query.where.AND = buildWhereQuery(filter.filters);

  if (filter.searchFilters) {
    const sanitized = sanitizeSearchFilters(filter.searchFilters, allowedSearchFields);
    appendAll(query.where.AND, buildSearchQuery(sanitized));
  }

  if (filter.rangedFilters) {
    appendAll(query.where.AND, buildRangedFilter(filter.rangedFilters));
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

  query.take = toPositiveInt(filter.rows, 10) + 1;
  return query;
}

/**
 * Response helpers (kept)
 */
export function buildCursorRecordsResponse<T extends { createdAt: Date; id: number }, D>(
  rows: T[],
  limit: number,
  map: (row: T) => D
): { records: D[]; nextCursor: CursorMeta | null; prevCursor: CursorMeta | null } {
  const hasNext = rows.length > limit;
  const data = hasNext ? rows.slice(0, limit) : rows;

  const records = data.map(map);
  const nextCursor = hasNext
    ? { createdAt: data.at(-1)!.createdAt.toISOString(), id: data.at(-1)!.id }
    : null;
  const prevCursor = data.length > 0 ? { createdAt: data[0].createdAt.toISOString(), id: data[0].id } : null;

  return { records, nextCursor, prevCursor };
}

export function buildCursorRecordsResponseFromFilter<T extends { createdAt: Date; id: number }, D>(
  rows: T[],
  filter: { rows?: number } | undefined,
  map: (row: T) => D
): { records: D[]; nextCursor: CursorMeta | null; prevCursor: CursorMeta | null } {
  return buildCursorRecordsResponse(rows, getLimit(filter), map);
}

export function buildOffsetRecordsResponse<T, D>(rows: T[], map: (row: T) => D): { records: D[] } {
  return { records: rows.map(map) };
}

/**
 * Composable builder + executors
 * -----------------------------
 * - Same behavior building state.where.AND
 * - offset(): sets skip/take, also saves meta {page, rows}
 * - cursor(): sets take=rows+1, saves meta {rows}
 * - executeOffset(): handles list+count+paging
 * - executeCursor(): handles list(cursor take=rows+1)+cursor response
 */
export function cursorFilterBuilder(filter: Filter, allowedSearchFields: string[]) {
  const state: any = { where: { AND: [] as any[] }, orderBy: {} as any };
  const rows = toPositiveInt(filter.rows, 10);
  let mode: "cursor" | "offset" = "offset";

  let offsetMeta: OffsetMetaInternal | null = null;
  let cursorMeta: CursorMetaInternal | null = null;

  const api = {
    filters() {
      // behavior: reset AND from filter.filters
      if (filter.filters) state.where.AND = buildWhereQuery(filter.filters);
      return api;
    },

    search() {
      if (!filter.searchFilters) return api;
      const sanitized = sanitizeSearchFilters(filter.searchFilters, allowedSearchFields);
      appendAll(state.where.AND, buildSearchQuery(sanitized));
      return api;
    },

    range() {
      if (filter.rangedFilters) appendAll(state.where.AND, buildRangedFilter(filter.rangedFilters));
      return api;
    },

    order() {
      if (filter.orderKey) state.orderBy = { [filter.orderKey]: filter.orderRule ?? "asc" };
      return api;
    },

    cursor() {
      mode = "cursor";
      state.take = rows + 1;
      cursorMeta = { rows };

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
    },

    offset() {
      mode = "offset";
      const page = toPositiveInt(filter.page, 1);

      state.take = rows;
      state.skip = (page - 1) * rows;

      offsetMeta = { page, rows };

      return api;
    },

    all() {
      api.filters();
      api.search();
      api.range();
      api.order();
      state.take = rows;
      return api;
    },

    build() {
      return state;
    },

    response<T extends { createdAt: Date; id: number }, D>(rowsData: T[], map: (row: T) => D) {
      return mode === "cursor"
        ? buildCursorRecordsResponse(rowsData, rows, map)
        : buildOffsetRecordsResponse(rowsData, map);
    },

    /**
     * Execute OFFSET pagination without service thinking about it.
     * You pass repo adapter { list, count } so this is reusable across modules.
     */
    async executeOffset<T, D>(
      repo: {
        list: (query: any) => Promise<T[]>;
        count: (where: any) => Promise<number>;
      },
      map: (row: T) => D
    ): Promise<OffsetResult<D>> {
      if (!offsetMeta) {
        throw new Error("executeOffset() called without offset()");
      }

      const [rowsData, totalRows] = await Promise.all([repo.list(state), repo.count(state.where)]);

      const { page, rows } = offsetMeta;
      const totalPages = totalRows ? Math.max(1, Math.ceil(totalRows / rows)) : 0;

      return {
        records: rowsData.map(map),
        pagination: { page, rows, totalRows, totalPages }
      };
    },

    /**
     * Execute CURSOR pagination without service thinking about it.
     * Notes:
     * - cursor() should be called before executeCursor() so `take = rows + 1` is set.
     * - For cursor mode, total count is intentionally NOT computed (keeps behavior consistent with cursor style).
     */
    async executeCursor<T extends { createdAt: Date; id: number }, D>(
      repo: { list: (query: any) => Promise<T[]> },
      map: (row: T) => D
    ): Promise<CursorResult<D>> {
      if (!cursorMeta) {
        throw new Error("executeCursor() called without cursor()");
      }

      const rowsData = await repo.list(state);
      const { records, nextCursor, prevCursor } = buildCursorRecordsResponse(
        rowsData,
        cursorMeta.rows,
        map
      );

      return { records, nextCursor, prevCursor };
    }
  };

  return api;
}
