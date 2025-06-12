"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useDamData } from "@/hooks/useDamData";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AlertMessage } from "@/components/ui/AlertMessage";
import { useTranslatedPageTitle } from "@/hooks/useTranslatedPageTitle";
import DataSource from "@/components/DataSource";
import { useTranslation } from "react-i18next";
import WaterWave from "@/components/WaterWave"; // Import the new component

export default function DamsPage() {
  const { data: damDataResponse, isLoading, error } = useDamData();
  const { t } = useTranslation();
  useTranslatedPageTitle("title.dams");

  /** pick the latest reading per dam */
  const uniqueDams = useMemo(() => {
    if (!damDataResponse?.data) return [];
    const map = new Map<string, typeof damDataResponse.data[0]>();
    damDataResponse.data.forEach((item) => {
      if (!item.barragem) return;
      const current = map.get(item.barragem);
      if (
        !current ||
        (item._time &&
          current._time &&
          item._time > current._time)
      ) {
        map.set(item.barragem, item);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.barragem && b.barragem
        ? a.barragem.localeCompare(b.barragem)
        : 0,
    );
  }, [damDataResponse]);

  if (isLoading) return <LoadingSpinner />;
  if (error)
    return (
      <AlertMessage
        type="error"
        message={
          error instanceof Error
            ? error.message
            : "An error occurred"
        }
      />
    );
  if (!uniqueDams.length)
    return (
      <AlertMessage
        type="warning"
        message="No dam data available. Please check your connection or try again later."
      />
    );

  return (
    <div className="text-darkGray">
      <DataSource
        position="header"
        textKey="dam.dataSource"
        linkKey="dam.sir"
        linkUrl="https://sir.dgadr.gov.pt/outras/reserva-de-agua-nas-albufeiras"
      />
      
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueDams.map((dam) => {
          const percent = dam.enchimento
            ? Math.min(dam.enchimento * 100, 100)
            : 0;

          return (
            <Link
              href={`/dams/${dam.barragem}`}
              key={dam.barragem}
            >
              <li className="p-4 border border-gray200 rounded-lg shadow h-full w-full cursor-pointer hover:shadow-md transition-shadow">
                {/* Using the new WaterWave component */}
                <div className="mb-4">
                  <WaterWave 
                    fillPercentage={percent} 
                    showBadge={true}
                    badgePosition="bottom-right"
                  />
                </div>

                <h2 className="text-xl font-semibold">
                  {dam.barragem}
                </h2>
                <p className="text-gray600 text-sm">
                  {t("dam.lastUpdated")}:{" "}
                  {dam._time
                    ? new Date(
                        dam._time,
                      ).toLocaleDateString("en-GB")
                    : "N/A"}
                </p>
              </li>
            </Link>
          );
        })}
      </ul>
    </div>
  );
}