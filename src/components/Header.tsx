"use client"
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useContext } from "react";

export function Header() {
    const pathName = usePathname().split('/');
    const pageName = pathName[1].toUpperCase() === '' ? 'HOME' : pathName[1].toUpperCase();

    const { sidebarOpen, handleChangeSidebar } = useContext(SidebarHeaderContext);

    return (
        <header className="flex items-center bg-background w-full min-h-[120px] px-8 relative">
            <div className="flex flex-col w-full">
                <div className="flex items-center gap-8">
                    <button onClick={handleChangeSidebar}>
                        { sidebarOpen ? 
                            <Menu className="text-primary bg-secondary rounded-lg p-1" size={36} />
                            :
                            <Menu className="text-primary bg-background rounded-lg p-1" size={36} />
                        }
                    </button>
                    <span className="text-darkGray text-4xl font-extrabold">{pageName}</span>
                </div>
                <hr className="flex h-0.5 w-[calc(100%-50px)] bg-lightGray m-auto absolute bottom-0 left-0 right-0" />
            </div>
        </header>
    );
}