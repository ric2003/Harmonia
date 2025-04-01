"use client";
import SentinelMap from "@/components/SentinelMap";
import { useSetPageTitle } from '@/hooks/useSetPageTitle';

export default function Home() {
  useSetPageTitle('Sentinel Map');
  return (
    <SentinelMap />
  );
}
