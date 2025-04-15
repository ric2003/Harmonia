import { useTranslation } from "react-i18next";

interface PageControllerProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function PageController({ currentPage, totalPages, onPageChange }: PageControllerProps) {
    const { t } = useTranslation();
    
    return (
        <div className="flex items-center justify-center space-x-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-lightGray rounded-md text-xs font-medium text-darkGray bg-background hover:bg-gray50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('dam.table.previous')}
            </button>

            <div className="flex items-center">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                  onPageChange(page);
                }}
                className="w-14 text-center border border-lightGray rounded-md shadow-sm px-2 py-1.5 text-xs text-darkGray bg-background"
                min={1}
                max={totalPages}
              />
              <span className="ml-1.5 text-gray700 text-xs">{t('dam.table.ofPages', { totalPages })}</span>
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 border border-lightGray rounded-md text-xs font-medium text-darkGray bg-background hover:bg-gray50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('dam.table.next')}
            </button>
        </div>
    );
}