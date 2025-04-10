'use client';

import React from 'react';
import { useContext } from "react";
import SimulationMap from '@/components/SimulationMap';
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";


const SimulationPage = () => {
  useTranslatedPageTitle('title.sorraiaMap');
  const { sidebarOpen } = useContext(SidebarHeaderContext);
  return (
    <SimulationMap 
      key={sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} 
    />
  );
};

export default SimulationPage; 