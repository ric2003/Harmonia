"use client";
import Link from "next/link";
import StationImage from "@/components/StationImage";
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import DataSource from "@/components/DataSource";
import { useStations } from "@/hooks/useStations";

export default function StationsPage() {
  const { data: stations = [], isLoading: loading, error } = useStations();
  useTranslatedPageTitle('title.stations');

  return (
    <div className="space-y-8">
      <DataSource 
        introTextKey="station.stationsOverviewIntro"
        textKey="home.dataSource"
        linkKey="home.irristrat"
        linkUrl="https://irristrat.com/new/index.php"
      />
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="glass-card p-6 h-full w-full">
              <div className="mb-4 w-full">
                <div className="glass-light rounded-lg w-full aspect-video animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="h-6 glass-light rounded w-3/4 animate-pulse"></div>
                <div className="h-4 glass-light rounded w-1/2 animate-pulse"></div>
                <div className="h-4 glass-light rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-6">
          <p className="text-red-500 dark:text-red-400 text-center">{error.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => {
            const imageUrl = `/images/${station.id}.png`;
            return (
              <Link href={`/stations/${station.id}`} key={station.id}>
                <div className="glass-card p-4 h-full w-full group hover:glass-medium cursor-pointer">
                  <div className="mb-4 w-full flex justify-center">
                    <div className="relative overflow-hidden rounded-lg w-full aspect-video">
                      <StationImage
                        src={imageUrl}
                        width={600}
                        height={400}
                        className="rounded-lg w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={`${station.estacao.slice(7,)} thumbnail`}
                        fallbackSrc="/images/default.png"
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray700 group-hover:text-primary">
                      {station.estacao.slice(7,)}
                    </h2>
                    <p className="text-gray600 text-sm">
                      {station.loc}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}