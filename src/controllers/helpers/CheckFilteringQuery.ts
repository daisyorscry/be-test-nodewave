import { ClauseFilters, FilteringQuery, FilteringQueryV2, RangedFilter } from "$entities/Query";
import { Request } from "express";

export function checkFilteringQuery(req: Request): FilteringQuery {
  let filter: FilteringQuery = {};
  if (req.query.orderKey) {
    filter = { ...filter, orderKey: req.query.orderKey.toString() };
  }
  if (req.query.orderRule) {
    filter = { ...filter, orderRule: req.query.orderRule.toString() };
  }
  if (req.query.filters) {
    filter = {
      ...filter,
      filters: JSON.parse(req.query.filters.toString()) as ClauseFilters,
    };
  }
  if (req.query.searchValue && req.query.searchKey) {
    filter = {
      ...filter,
      searchKey: req.query.searchKey.toString(),
      searchValue: req.query.searchValue.toString(),
    };
  }
  

  if (req.query.rows) {
    const rows = Number(req.query.rows);
    if (Number.isFinite(rows) && rows > 0) {
      filter = {
        ...filter,
        rows
      };
    }
  }

  if (req.query.cursor) {
    filter = {
      ...filter,
      cursor: req.query.cursor.toString(),
    };

    if (req.query.cursorDirection) {
      filter = {
        ...filter,
        cursorDirection: req.query.cursorDirection?.toString(),
      };
    }
  }

  if (req.query.page) {
    const page = Number(req.query.page);
    if (Number.isFinite(page) && page > 0) {
      filter = {
        ...filter,
        page
      };
    }
  }

  if (req.query.startRange && req.query.endRange) {
    filter = {
      ...filter,
      startRange: req.query.startRange.toString(),
      endRange: req.query.endRange.toString(),
    };
  }

  return filter;
}


/*

Legacy V1 Above 

Please use V2 :)

*/

export function checkFilteringQueryV2(req: Request): FilteringQueryV2 {

  let filter: FilteringQueryV2 = {};

  if (req.query.orderKey) {
    filter.orderKey = req.query.orderKey.toString()
  }
  if (req.query.orderRule) {
    const rule = req.query.orderRule.toString();
    if (rule === "asc" || rule === "desc") {
      filter.orderRule = rule;
    }
  }
  if (req.query.filters) {
    filter.filters = JSON.parse(req.query.filters.toString()) as  Record<string, any | any[] | null>
  }

  if (req.query.searchFilters) {
    filter.searchFilters= JSON.parse(req.query.searchFilters.toString()) as  Record<string, any | any[] | null>
  }

  if (req.query.rangedFilters) {
    filter.rangedFilters= JSON.parse(req.query.rangedFilters.toString()) as RangedFilter[]
  }
  
  if (req.query.rows) {
    filter = {
      ...filter,
      // page: Number(req.query.page),
      rows: Number(req.query.rows),
    };
  }

  if (req.query.page){
    filter={
        ...filter,
        page: Number(req.query.page)
    }
  }

  if (req.query.cursorCreatedAt) {
    filter = {
      ...filter,
      cursorCreatedAt: req.query.cursorCreatedAt.toString()
    };
  }
  if (req.query.cursorId) {
    const cursorId = Number(req.query.cursorId);
    if (Number.isFinite(cursorId)) {
      filter = {
        ...filter,
        cursorId
      };
    }
  }

  return filter;
}
