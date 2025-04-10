"use client"
import Image from "next/image";
import { LinkButton } from "./LinkButton";
import { Building, Home, Moon, Sheet, Sun, Droplets, Map, Satellite } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import * as Switch from "@radix-ui/react-switch";
import { ThemeContext } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export function Sidebar() {
    const { sidebarOpen } = useContext(SidebarHeaderContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { t } = useTranslation();
    const [switchWidth, setSwitchWidth] = useState(160);
    const lightTextRef = useRef<HTMLSpanElement>(null);
    const darkTextRef = useRef<HTMLSpanElement>(null);

    function handleModeChange() {
        toggleTheme();
    }

    useEffect(() => {
        if (lightTextRef.current && darkTextRef.current) {
            const lightWidth = lightTextRef.current.offsetWidth;
            const darkWidth = darkTextRef.current.offsetWidth;
            
            const maxTextWidth = Math.max(lightWidth, darkWidth);
            const calculatedWidth = (maxTextWidth * 2) + 70;
            
            const newWidth = Math.max(130, calculatedWidth);
            setSwitchWidth(newWidth);
        }
    }, [t('common.theme.light'), t('common.theme.dark')]);

    const thumbWidth = Math.floor(switchWidth / 2) - 5;
    const thumbPositionChecked = switchWidth - thumbWidth - 5;

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

                    <div className="flex items-center justify-center absolute bottom-4">
                        <Switch.Root
                            checked={theme === "dark"}
                            onCheckedChange={handleModeChange}
                            className="cursor-pointer relative rounded-lg bg-lightGray outline-none data-[state=checked]:bg-toggleBackground"
                            style={{ width: `${switchWidth}px`, height: '32px' }}
                        >
                            <div className="flex h-full">
                                <div className="flex relative z-[1] text-primary gap-1 items-center font-semibold w-1/2 justify-center text-sm px-2">
                                    <Sun size={16} />
                                </div>
                                <div className="flex relative z-[1] text-primary gap-1 items-center font-semibold w-1/2 justify-center text-sm px-2">
                                    <Moon size={16} />
                                </div>
                            </div>
                            <div 
                                className="absolute top-1/2 block rounded-lg bg-background transform transition-transform duration-200"
                                style={{ 
                                    width: `${thumbWidth}px`, 
                                    height: '25px',
                                    transform: `translateY(-50%) translateX(${theme === "dark" ? thumbPositionChecked : 5}px)`
                                }}
                            />
                        </Switch.Root>
                    </div>
                </div>
            }
        </div>
    );
}