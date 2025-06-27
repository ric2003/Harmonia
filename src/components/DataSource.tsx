'use client';

import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Info, ExternalLink, Layers } from 'lucide-react';
import { SidebarHeaderContext } from '@/contexts/SidebarHeaderContext';

interface DataSourceProps {
  className?: string;
  introTextKey: string;
  textKey?: string;
  linkKey?: string;
  linkUrl?: string;
}

export default function DataSource({ 
  className = '', 
  introTextKey,
  textKey,
  linkKey,
  linkUrl
}: DataSourceProps) {
  const { t } = useTranslation();
  const { dataSourceExpanded, setDataSourceExpanded } = useContext(SidebarHeaderContext);

  return (
    <div className={`mb-6 ${className}`}>
      {dataSourceExpanded ? (
        // Expanded state with new glass utilities
        <div className="glass-card p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <div className="relative">
            {/* Close button positioned at top-right */}
            <button
              onClick={() => setDataSourceExpanded(false)}
              className="absolute top-0 right-0 p-2 text-gray500 hover:text-gray600 rounded-full glass-transparent hover:glass-light"
              aria-label="Close site details"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            <div className="pr-10 space-y-5">
              {/* Site Details Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray700">
                  {t('navigation.siteDetails')}
                </h3>
              </div>

              {/* Page usage section */}
              <div className="glass-card rounded-xl p-5 shadow-sm">
                <h4 className="text-base font-medium text-gray700 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  {t('station.howToUseThisPage')}
                </h4>
                <p className="text-gray600 leading-relaxed text-sm">
                  {t(introTextKey)}
                </p>
              </div>
              
              {/* Data source information - only render if linkKey and linkUrl are provided */}
              {linkKey && linkUrl && textKey && (
                <div className="glass-card rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray700">
                        {t(textKey)}
                      </span>
                    </div>
                    <a 
                      href={linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary font-medium inline-flex items-center gap-2 text-sm hover:underline transition-colors duration-200"
                    >
                      {t(linkKey)}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
              
              {/* Data source information without link - render if no link provided */}
              {(!linkKey || !linkUrl) && textKey && (
                <div className="glass-card rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray700">
                      {t(textKey)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Collapsed state with subtle glass effect
        <div>
          <button
            onClick={() => setDataSourceExpanded(true)}
            className="flex items-center gap-2 text-sm text-gray500 hover:text-primary"
            aria-label="Show site details"
          >
            <Layers className="w-4 h-4" />
            <span>{t("navigation.siteDetails")}</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
} 