'use client';

import React from 'react';
import { useContext } from "react";
import SimulationMap from '@/components/SimulationMap';
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import DataSource from "@/components/DataSource";

const SimulationPage = () => {
  useTranslatedPageTitle('title.sorraiaMap');
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  return (
    <div className="flex flex-col">
      <DataSource 
        introTextKey="simulationMap.dataSourceIntro"
      />
      
      <div className="rounded-lg overflow-hidden">
        <SimulationMap 
          key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} 
        />
      </div>
    </div>
  );
};

export default SimulationPage; 