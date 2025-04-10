"use client";

import { useContext } from "react";
import SentinelMap from "@/components/SentinelMap";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import DataSourceFooter from "@/components/DataSourceFooter";

export default function Home() {
  useTranslatedPageTitle('title.sentinelMap');
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  return (
    <div className="flex flex-col h-screen">
      <div className="h-full mb-20 rounded-lg overflow-hidden">
        <SentinelMap
          key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} 
        />
      </div>
      <div>
        <DataSourceFooter 
          textKey="sentinel.dataSource"
          linkKey="sentinel.sentinelHub"
          linkUrl="https://www.sentinel-hub.com/"
        />
      </div>
    </div>
  );
}
