import { STUDIO_PAGINATION as C } from "../constants/studioTheme.js";
export const getPagination = (total: number, requestedPage: number, pageSize: number) => {
  const pageCount = Math.max(C.FIRST_PAGE, Math.ceil(total / pageSize));
  const page = Math.max(C.FIRST_PAGE, Math.min(requestedPage, pageCount));
  const start = (page - C.FIRST_PAGE) * pageSize;
  const end = Math.min(start + pageSize, total);
  const first = Math.max(C.FIRST_PAGE, Math.min(page - Math.floor(C.VISIBLE_PAGES / 2), pageCount - C.VISIBLE_PAGES + C.FIRST_PAGE));
  const pages = Array.from({ length: Math.min(C.VISIBLE_PAGES, pageCount) }, (_, index) => first + index);
  return { page, pageCount, start, end, pages };
};
