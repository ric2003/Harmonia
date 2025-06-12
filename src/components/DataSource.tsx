'use client';

import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Info, ExternalLink } from 'lucide-react';
import { SidebarHeaderContext } from '@/contexts/SidebarHeaderContext';

interface DataSourceProps {
  className?: string;
  textKey: string;
  linkKey: string;
  linkUrl: string;
  position?: 'header' | 'footer';
}

export default function DataSource({ 
  className = '', 
  textKey,
  linkKey,
  linkUrl,
  position = 'header'
}: DataSourceProps) {
  const { t } = useTranslation();
  const { dataSourceExpanded, setDataSourceExpanded } = useContext(SidebarHeaderContext);

  // Determine styling based on position
  const containerClasses = position === 'header' 
    ? `mb-6 ${className}`
    : `mt-0 border-t border-gray-200 dark:border-gray-700 ${className}`;

  const expandedClasses = position === 'header'
    ? "py-3 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
    : "py-3 px-4";

  const collapsedClasses = position === 'header'
    ? "py-1 px-2"
    : "py-1 px-4";

  return (
    <div className={containerClasses}>
      {dataSourceExpanded ? (
        // Expanded state
        <div className={expandedClasses}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
              <span className="mr-2">{t(textKey)}</span>
              <a 
                href={linkUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 font-medium inline-flex items-center gap-1"
              >
                {t(linkKey)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <button
              onClick={() => setDataSourceExpanded(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Collapse data source"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Collapsed state
        <div className={collapsedClasses}>
          <button
            onClick={() => setDataSourceExpanded(true)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Show data source"
          >
            <Info className="w-3 h-3" />
            <span>Data Source</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
} 