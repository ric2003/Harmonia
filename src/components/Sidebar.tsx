"use client"
import Image from "next/image";
import { LinkButton } from "./LinkButton";
import { Building, Home, Sheet, Droplets, Map } from "lucide-react";
import { useContext } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export function Sidebar() {
    const { sidebarOpen } = useContext(SidebarHeaderContext);
    const { theme } = useContext(ThemeContext);
    const { t } = useTranslation();

    return (
        <div className="hidden sm:block z-[2]">
            <div className={`flex flex-col items-center h-full ${sidebarOpen ? 'w-[225px]' : ''} bg-background shadow-[rgba(0,0,0,0.25)_2px_0_20px_1px] z-[2]`}>
                <div className="h-[87px] flex items-center justify-center">
                    <Image 
                        src={sidebarOpen ? theme === "light" ? "/logo.svg" : "/logoDarkMode.svg" : theme === "light" ? "/logoNoText.svg" : "/logoDarkModeNoText.svg"} 
                        width={sidebarOpen ? 80 : 55} 
                        height={sidebarOpen ? 80 : 55} 
                        alt="Water Wise Logo"
                        style={{ transition: 'height 0.05s ease-in-out, height 0.05s ease-in-out' }}
                    />
                </div>
                <hr className="h-0.5 bg-lightGray w-4/5 mt-[1px]" />
                <nav className={`${sidebarOpen ? 'pt-12' : 'pt-6'} w-full ${sidebarOpen ? 'px-4' : 'px-2'}`}>
                    <ul className="flex flex-col items-center text-primary gap-2">
                        <LinkButton 
                            route="/" 
                            name={sidebarOpen ? t('navigation.home') : t('navigation.homeShort')} 
                            icon={<Home size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/stations" 
                            name={sidebarOpen ? t('navigation.stations') : t('navigation.stationsShort')} 
                            icon={<Building size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/dam-monitoring" 
                            name={sidebarOpen ? t('navigation.damMonitoring') : t('navigation.damMonitoringShort')} 
                            icon={<Droplets size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        {/*<LinkButton 
                            route="/sentinel" 
                            name={sidebarOpen ? t('navigation.sentinelMap') : t('navigation.sentinelMapShort')} 
                            icon={<Satellite size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />*/}
                        <LinkButton 
                            route="/sorraia-map" 
                            name={sidebarOpen ? t('navigation.sorraiaMap') : t('navigation.sorraiaMapShort')} 
                            icon={<Map size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/excel" 
                            name={sidebarOpen ? t('navigation.excelUpload') : t('navigation.excelUploadShort')} 
                            icon={<Sheet size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                    </ul>
                </nav>
            </div>
        </div>
    );
}