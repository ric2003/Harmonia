import { useTranslation } from 'react-i18next';

interface DataSourceFooterProps {
  className?: string;
  textKey: string;
  linkKey: string;
  linkUrl: string;
}

export default function DataSourceFooter({ 
  className = '', 
  textKey,
  linkKey,
  linkUrl
}: DataSourceFooterProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`mt-8 py-3 px-4 border-t border-gray-200 ${className}`}>
      <p className="text-sm text-gray-500 flex items-center">
        <span className="mr-2">{t(textKey)}</span>
        <a 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:text-primary/80 transition-colors duration-200"
        >
          {t(linkKey)}
        </a>
      </p>
    </div>
  );
} 