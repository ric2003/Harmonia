"use client"
import Image from "next/image";
import { LinkButton } from "./LinkButton";
import { Building, Home, Moon, NotebookText, Sheet, Sun } from "lucide-react";
import { useContext } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import * as Switch from "@radix-ui/react-switch";
import { ThemeContext } from "@/contexts/ThemeContext";

export function Sidebar() {
    const { sidebarOpen } = useContext(SidebarHeaderContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    function handleModeChange() {
        document.documentElement.classList.add('disable-transitions');
        toggleTheme();
        setTimeout(() => {
            document.documentElement.classList.remove("disable-transitions");
        }, 0);
    }

    return (
        <div className="z-[2]">
            { sidebarOpen &&
                <div className="flex flex-col items-center h-full w-[300px] bg-background shadow-[rgba(0,0,0,0.25)_2px_0_20px_1px] z-[2]">
                    <Image src={theme === "light"?"/logo.svg":"/logoDarkMode.svg"} width={139} height={117} alt="" />

                    <hr className="h-0.5 bg-lightGray w-4/5 mt-[1px]" />

                    <nav className="pt-16 w-full px-8">
                        <ul className="flex flex-col items-center text-primary gap-4">
                        <LinkButton route="/" name="Home" icon={<Home size={24} />} />
                        <LinkButton route="/api" name="Api Page" icon={<NotebookText size={24} />} />
                        <LinkButton route="/stations" name="Stations Page" icon={<Building size={24} />} />
                        <LinkButton route="/excel" name="Excel Page" icon={<Sheet size={24} />} />
                        </ul>
                    </nav>

                    <div className="flex items-center justify-center absolute bottom-4">
                        <Switch.Root checked={theme === "dark"} onCheckedChange={handleModeChange} className="cursor-pointer relative w-[160px] h-[38px] rounded-lg bg-lightGray outline-none data-[state=checked]:bg-toggleBackground">
                            <div className="flex">
                                <div className="flex relative z-[1] text-primary gap-1 items-center font-semibold w-1/2 justify-center">
                                    <Sun />
                                    Light
                                </div>
                                <div className="flex relative z-[1] text-primary gap-1 items-center font-semibold w-1/2 justify-center">
                                    <Moon />
                                    Dark
                                </div>
                            </div>
                            <Switch.Thumb className="top-1 absolute block w-[72px] h-[30px] translate-x-1 rounded-lg bg-background data-[state=checked]:translate-x-[84px] transition-transform preserve-transition" />
                        </Switch.Root>
                    </div>
                </div>
            }
        </div>
    );
}