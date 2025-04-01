"use client"
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Menu } from "lucide-react";
import { useContext } from "react";

interface SidebarHeaderContextType {
  sidebarOpen: boolean;
  handleChangeSidebar: () => void;
}

export function Header() {
    const { pageTitle } = usePageTitle();
    const { sidebarOpen, handleChangeSidebar } = useContext(SidebarHeaderContext) as SidebarHeaderContextType;

    return (
        <header className="flex items-center bg-background w-full min-h-[90px] px-6 relative">
            <div className="flex flex-col w-full">
                <div className="flex items-center gap-6">
                    <button onClick={handleChangeSidebar}>
                        { sidebarOpen ? 
                            <Menu className="text-primary bg-secondary rounded-lg p-1" size={27} />
                            :
                            <Menu className="text-primary bg-background rounded-lg p-1" size={27} />
                        }
                    </button>
                    <span className="text-darkGray text-3xl font-extrabold">{pageTitle}</span>
                </div>
                <hr className="flex h-0.5 w-[calc(100%-38px)] bg-lightGray m-auto absolute bottom-0 left-0 right-0" />
            </div>
        </header>
    );
}