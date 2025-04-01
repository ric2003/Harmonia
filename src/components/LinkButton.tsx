"use client"
import Link from "next/link";
import "../app/globals.css";
import { usePathname } from "next/navigation";

interface LinkButtonProps {
    route: string;
    name: string;
    icon: React.ReactNode;
}

export function LinkButton({ route, name, icon }: LinkButtonProps) {
    const pathName = usePathname().split('/');
    const backgroundColor =`/${pathName[1]}` === route ? "bg-secondary" : "bg-background"

    
    return (
        <Link
            className={"flex items-center justify-start w-full h-12 rounded-lg gap-3 p-3 border-2 border-background hover:border-primary " + (backgroundColor)}
            href={route}
        >
            {icon}
            <li className="text-[15px] font-semibold">{name}</li>
        </Link>
    );
}