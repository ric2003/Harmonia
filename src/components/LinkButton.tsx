"use client"
import Link from "next/link";
import "../app/globals.css";
import { usePathname } from "next/navigation";

interface LinkButtonProps {
    route: string;
    name: string;
    icon: React.ReactNode;
    compact?: boolean;
}

export function LinkButton({ route, name, icon, compact = false }: LinkButtonProps) {
    const pathName = usePathname().split('/');
    const backgroundColor = `/${pathName[1]}` === route ? "bg-secondary" : "bg-background"
    
    return (
        <Link
            className={`flex ${compact ? 'flex-col items-center justify-center gap-1 h-16 p-1' : 'flex-row items-center justify-start gap-3 h-12 p-3'} w-full rounded-lg border-2 border-background hover:border-primary ${backgroundColor}`}
            href={route}
        >
            <div className={`${compact ? 'mb-1' : ''}`}>{icon}</div>
            <span className={`${compact ? 'text-[11px] text-center' : 'text-[15px]'} font-semibold`}>{name}</span>
        </Link>
    );
}