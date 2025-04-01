"use client"
import Image from "next/image";
import { LinkButton } from "./LinkButton";
import { Building, Home, Moon, Sheet, Sun, Droplets, Map } from "lucide-react";
import { useContext } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import * as Switch from "@radix-ui/react-switch";
import { ThemeContext } from "@/contexts/ThemeContext";

export function Sidebar() {
    const { sidebarOpen } = useContext(SidebarHeaderContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    function handleModeChange() {
        toggleTheme();
    }

    return (
        <div className="z-[2]">
            { sidebarOpen &&
                <div className="flex flex-col items-center h-full w-[225px] bg-background shadow-[rgba(0,0,0,0.25)_2px_0_20px_1px] z-[2]">
                    <Image src={theme === "light"?"/logo.svg":"/logoDarkMode.svg"} width={104} height={88} alt="" />

                    <hr className="h-0.5 bg-lightGray w-4/5 mt-[1px]" />

                    <nav className="pt-12 w-full px-6">
                        <ul className="flex flex-col items-center text-primary gap-3">
                        <LinkButton route="/" name="Home" icon={<Home size={18} />} />
                        <LinkButton route="/stations" name="Stations Page" icon={<Building size={18} />} />
                        <LinkButton route="/dam-monitoring" name="Reservoir Monitor" icon={<Droplets size={18} />} />
                        <LinkButton route="/sentinel" name="Sentinel Map" icon={<Map size={18} />} />
                        <LinkButton route="/excel" name="Excel Upload" icon={<Sheet size={18} />} />
                        </ul>
                    </nav>

                    <div className="flex items-center justify-center absolute bottom-4">
                        <Switch.Root 
                            checked={theme === "dark"} 
                            onCheckedChange={handleModeChange} 
                            className="cursor-pointer relative w-[130px] h-[32px] rounded-lg bg-lightGray outline-none data-[state=checked]:bg-toggleBackground"
                        >
                            <div className="flex">
                            <div className="flex relative z-[1] text-primary gap-1 items-center font-semibold w-1/2 justify-center text-sm px-2">
                                <Sun size={16} />
                                Light
                            </div>
                            <div className="flex relative z-[1] text-primary gap-1 items-center font-semibold w-1/2 justify-center text-sm px-2">
                                <Moon size={16} />
                                Dark
                            </div>
                            </div>
                            <Switch.Thumb className="absolute top-1/2 -translate-y-1/2 block w-[60px] h-[25px] rounded-lg bg-background transform transition-transform duration-200 data-[state=unchecked]:translate-x-[5px] data-[state=checked]:translate-x-[65px]" />
                        </Switch.Root>
                    </div>
                </div>
            }
        </div>
    );
}