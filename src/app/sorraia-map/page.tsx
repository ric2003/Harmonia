'use client';

import React from 'react';
import SimulationMap from '@/components/SimulationMap';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';

const SimulationPage = () => {
  useSetPageTitle("Sorraia Water Simulation Map");
  return (
    <SimulationMap />
  );
};

export default SimulationPage; 