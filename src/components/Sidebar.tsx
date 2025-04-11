"use client"
import Image from "next/image";
import { LinkButton } from "./LinkButton";
import { Building, Home, Sheet, Droplets, Map, Satellite } from "lucide-react";
import { useContext } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export function Sidebar() {
    const { sidebarOpen } = useContext(SidebarHeaderContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useTranslation();

    return (
        <div className="z-[2]">
            {sidebarOpen &&
                <div className="flex flex-col items-center h-full w-[225px] bg-background shadow-[rgba(0,0,0,0.25)_2px_0_20px_1px] z-[2]">
                    <Image src={theme === "light" ? "/logo.svg" : "/logoDarkMode.svg"} width={104} height={88} alt="" />

                    <hr className="h-0.5 bg-lightGray w-4/5 mt-[1px]" />

                    <nav className="pt-12 w-full px-6">
                        <ul className="flex flex-col items-center text-primary gap-3">
                            <LinkButton route="/" name={t('navigation.home')} icon={<Home size={18} />} />
                            <LinkButton route="/stations" name={t('navigation.stations')} icon={<Building size={18} />} />
                            <LinkButton route="/dam-monitoring" name={t('navigation.damMonitoring')} icon={<Droplets size={18} />} />
                            <LinkButton route="/sentinel" name={t('navigation.sentinelMap')} icon={<Satellite size={18} />} />
                            <LinkButton route="/sorraia-map" name={t('navigation.sorraiaMap')} icon={<Map size={18} />} />
                            <LinkButton route="/excel" name={t('navigation.excelUpload')} icon={<Sheet size={18} />} />
                        </ul>
                    </nav>
                </div>
            }
        </div>
    );
}