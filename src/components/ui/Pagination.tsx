import { ChevronLeft, ChevronRight } from "lucide-react";
import { STUDIO_PAGINATION as S, STUDIO_PAGINATION_TEXT, STUDIO_UI } from "../../constants/studioTheme.js";
import { Button } from "./Button.js";
import { getPagination } from "../../lib/pagination.js";
export const Pagination = ({ page, pageSize, total, onChange, texts, disabled = false }: { page: number; pageSize: number; total: number; onChange: (page: number) => void; texts: typeof STUDIO_PAGINATION_TEXT.vi | typeof STUDIO_PAGINATION_TEXT.en; disabled?: boolean }) => {
  if (!total) return null;
  const { page: currentPage, pageCount, start, end, pages } = getPagination(total, page, pageSize);
  return (
    <nav className={S.ROOT} aria-label={texts.LABEL}>
      <p className={S.SUMMARY} aria-live={STUDIO_UI.POLITE_LIVE}>
        {texts.SUMMARY(start + 1, end, total)}
      </p>
      <div className={S.CONTROLS}>
        <Button type={STUDIO_UI.BUTTON_TYPE} variant={STUDIO_UI.UNSTYLED} className={S.BUTTON} disabled={disabled || currentPage <= S.FIRST_PAGE} onClick={() => onChange(currentPage - 1)} title={texts.PREVIOUS}>
          <ChevronLeft className={S.ICON} />
          <span>{texts.PREVIOUS}</span>
        </Button>
        {pages.map((value) => (
          <Button key={value} type={STUDIO_UI.BUTTON_TYPE} variant={value === currentPage ? STUDIO_UI.PRIMARY : STUDIO_UI.UNSTYLED} className={S.BUTTON} aria-label={texts.PAGE(value, pageCount)} aria-current={value === currentPage ? STUDIO_UI.PAGE_CURRENT : undefined} disabled={disabled} onClick={() => onChange(value)}>
            {value}
          </Button>
        ))}
        <Button type={STUDIO_UI.BUTTON_TYPE} variant={STUDIO_UI.UNSTYLED} className={S.BUTTON} disabled={disabled || currentPage >= pageCount} onClick={() => onChange(currentPage + 1)} title={texts.NEXT}>
          <span>{texts.NEXT}</span>
          <ChevronRight className={S.ICON} />
        </Button>
      </div>
    </nav>
  );
};
