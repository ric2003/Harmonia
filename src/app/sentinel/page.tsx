"use client";

import React, { useContext } from "react";
import SentinelMap from "@/components/SentinelMap";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import DataSource from "@/components/DataSource";

export default function Home() {
  useTranslatedPageTitle('title.sentinelMap');
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  return (
    <div className="flex flex-col">
      <DataSource 
        introTextKey="sentinel.dataSourceIntro"
        textKey="sentinel.dataSource"
        linkKey="sentinel.sentinelHub"
        linkUrl="https://www.sentinel-hub.com/"
      />
      
      <div className="rounded-lg overflow-hidden">
        <SentinelMap
          key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} 
        />
      </div>
    </div>
  );
}