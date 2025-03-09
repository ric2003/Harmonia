"use client"
import { useEffect, useState } from "react";
import { QueryResult } from "@/services/influx";

export default function DamData() {
    const [data, setData] = useState<QueryResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchInfluxData() {
        try {
            setLoading(true);
            // Call the API route
            const response = await fetch('/api/influx');
            
            // Parse the NextResponse object
            const responseData = await response.json();
            
            if (responseData.success) {
                setData(responseData.data);
            } else {
                setError(responseData.error || "Failed to fetch data");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchInfluxData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10 h-64">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-darkGray font-medium">Loading dam data...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-blue50 border-l-4 border-primary p-4 rounded shadow-md my-6">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-darkGray">
                            <span className="font-medium">Error:</span> {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (data.length === 0) {
        return (
            <div className="bg-blue50 border-l-4 border-primary p-4 rounded shadow-md my-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="ml-3 text-sm text-darkGray">
                        No dam data available. Please check your connection or try again later.
                    </p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            // Create a Date object from the provided string
            const originalDate = new Date(dateString);
            // Subtract one day (86400000 milliseconds)
            const adjustedDate = new Date(originalDate.getTime() - 86400000);// TODO find out why its one day ahead then the date shown on the excel
            // Extract the day, month, and year from the adjusted date using UTC to avoid local timezone shifts
            const day = adjustedDate.getUTCDate().toString().padStart(2, '0');
            const month = (adjustedDate.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
            const year = adjustedDate.getUTCFullYear();
            // Return in dd-mm-yyyy format
            return `${day}-${month}-${year}`;
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return dateString;
        }
    };

    const getDateObject = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        try {
            const originalDate = new Date(dateString);
            const adjustedDate = new Date(originalDate.getTime() - 86400000);
            return adjustedDate;
        } catch {
            return null;
        }
    };

    const DamTable = () => {
        const [currentPage, setCurrentPage] = useState(1);
        const recordsPerPage = 10; // Change this number as needed
        const [showFilters, setShowFilters] = useState(false);

        // Filter states
        const [filterDam, setFilterDam] = useState("");
        const [filterStartDate, setFilterStartDate] = useState("");
        const [filterEndDate, setFilterEndDate] = useState("");
        const [filterMinVolume, setFilterMinVolume] = useState("");
        const [filterMaxVolume, setFilterMaxVolume] = useState("");
        const [filterMinCotaLida, setFilterMinCotaLida] = useState("");
        const [filterMaxCotaLida, setFilterMaxCotaLida] = useState("");
        const [filterMinEnchimento, setFilterMinEnchimento] = useState("");
        const [filterMaxEnchimento, setFilterMaxEnchimento] = useState("");
        const [filterMinVolumeUtil, setFilterMinVolumeUtil] = useState("");
        const [filterMaxVolumeUtil, setFilterMaxVolumeUtil] = useState("");
        const [sortField, setSortField] = useState<string>("");
        const [sortDirection, setSortDirection] = useState<"lowest" | "highest">("lowest");

        // Filtragem dos dados com os novos filtros
        const filteredData = data.filter((record) => {
            // Dam name filter
            const matchesDam = filterDam.trim() === "" || 
                record.barragem?.toLowerCase().includes(filterDam.trim().toLowerCase());
            
            // Date range filter
            let matchesDateRange = true;
            const recordDate = getDateObject(record._time);
            
            if (filterStartDate && recordDate) {
                const startDate = new Date(filterStartDate);
                matchesDateRange = matchesDateRange && recordDate >= startDate;
            }
            
            if (filterEndDate && recordDate) {
                const endDate = new Date(filterEndDate);
                endDate.setHours(23, 59, 59, 999); // Set to end of day
                matchesDateRange = matchesDateRange && recordDate <= endDate;
            }
            
            // Volume total range filter
            const volumeTotal = record.volume_total !== null && record.volume_total !== undefined ? 
                Number(record.volume_total) : null;
            
            const matchesMinVolume = filterMinVolume === "" || 
                (volumeTotal !== null && volumeTotal >= Number(filterMinVolume));
            
            const matchesMaxVolume = filterMaxVolume === "" || 
                (volumeTotal !== null && volumeTotal <= Number(filterMaxVolume));
            
            // Cota lida range filter
            const cotaLida = record.cota_lida !== null && record.cota_lida !== undefined ? 
                Number(record.cota_lida) : null;
            
            const matchesMinCotaLida = filterMinCotaLida === "" || 
                (cotaLida !== null && cotaLida >= Number(filterMinCotaLida));
            
            const matchesMaxCotaLida = filterMaxCotaLida === "" || 
                (cotaLida !== null && cotaLida <= Number(filterMaxCotaLida));
            
            // Enchimento range filter
            const enchimento = record.enchimento !== null && record.enchimento !== undefined ? 
                Number(record.enchimento) : null;
            
            const matchesMinEnchimento = filterMinEnchimento === "" || 
                (enchimento !== null && enchimento >= Number(filterMinEnchimento));
            
            const matchesMaxEnchimento = filterMaxEnchimento === "" || 
                (enchimento !== null && enchimento <= Number(filterMaxEnchimento));
            
            // Volume util range filter
            const volumeUtil = record.volume_util !== null && record.volume_util !== undefined ? 
                Number(record.volume_util) : null;
            
            const matchesMinVolumeUtil = filterMinVolumeUtil === "" || 
                (volumeUtil !== null && volumeUtil >= Number(filterMinVolumeUtil));
            
            const matchesMaxVolumeUtil = filterMaxVolumeUtil === "" || 
                (volumeUtil !== null && volumeUtil <= Number(filterMaxVolumeUtil));
            
            return matchesDam && 
                   matchesDateRange && 
                   matchesMinVolume && 
                   matchesMaxVolume && 
                   matchesMinCotaLida && 
                   matchesMaxCotaLida && 
                   matchesMinEnchimento && 
                   matchesMaxEnchimento && 
                   matchesMinVolumeUtil && 
                   matchesMaxVolumeUtil;
        });
    
        const sortedData = [...filteredData].sort((a, b) => {
            if (!sortField) return 0;
            
            // Handle different data types
            const fieldA = a[sortField as keyof typeof a];
            const fieldB = b[sortField as keyof typeof b];
            
            // Skip sorting if field doesn't exist
            if (fieldA === undefined || fieldB === undefined) return 0;
            
            // Convert to numbers for numerical fields
            if (!isNaN(Number(fieldA)) && !isNaN(Number(fieldB))) {
                return sortDirection === "lowest" 
                    ? Number(fieldA) - Number(fieldB) 
                    : Number(fieldB) - Number(fieldA);
            }
            
            // String comparison
            return sortDirection === "lowest"
                ? String(fieldA).localeCompare(String(fieldB))
                : String(fieldB).localeCompare(String(fieldA));
        });

        // Replace filteredData with sortedData in pagination calculation
        const totalPages = Math.ceil(sortedData.length / recordsPerPage);
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const currentRecords = sortedData.slice(startIndex, endIndex);

        const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const pageNumber = Number(value);
        
            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
              setCurrentPage(pageNumber);
            }
        };

        const resetFilters = () => {
            setFilterDam("");
            setFilterStartDate("");
            setFilterEndDate("");
            setFilterMinVolume("");
            setFilterMaxVolume("");
            setFilterMinCotaLida("");
            setFilterMaxCotaLida("");
            setFilterMinEnchimento("");
            setFilterMaxEnchimento("");
            setFilterMinVolumeUtil("");
            setFilterMaxVolumeUtil("");
            setSortField("");
            setSortDirection("highest");
            setCurrentPage(1);
        };

        const handleSort = (field: string) => {
            // If clicking on the same field, toggle direction
            if (field === sortField) {
                setSortDirection(sortDirection === "lowest" ? "highest" : "lowest");
            } else {
                // New field, set it and default to lowestending
                setSortField(field);
                setSortDirection("highest");
            }
        };
    
        return (
            <div className="bg-background rounded-lg shadow-lg overflow-hidden my-5">
                <div className="px-6 py-4 bg-primary">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-white text-2xl font-bold">Dam Monitoring Data</h2>
                        </div>
                        <div className="flex items-center">
                        {!showFilters &&(
                        <button 
                            onClick={resetFilters}
                            className="text-sm text-gray50 hover:text-opacity-80 font-medium flex items-center px-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset All Filters
                        </button>
                        )}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 bg-background bg-opacity-20 hover:bg-opacity-30 rounded-md text-darkGray font-medium transition-all flex items-center"
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
          
                        </button>
                        </div>
                    </div>
                </div>
                
                {/* Replace the existing filters div with this */}
                {showFilters && (
                    <div className="p-6 bg-gray50 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-darkGray font-semibold">Filter Data</h3>
                        
                        <button 
                            onClick={resetFilters}
                            className="text-sm text-primary hover:text-opacity-80 font-medium flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset All Filters
                        </button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Dam Name Filter - Keep as text input but styled better */}
                            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm">
                                <label className="block text-sm font-medium text-darkGray mb-2">Dam Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Filter by dam name"
                                        value={filterDam}
                                        onChange={(e) => setFilterDam(e.target.value)}
                                        className="pl-10 w-full border border-lightGray rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary text-greySubText"
                                    />
                                </div>
                            </div>
                            
                            {/* Date Range Filter - Calendar input with better styling */}
                            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm">
                                <label className="block text-sm font-medium text-darkGray mb-2">Date Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="pl-10 w-full border border-lightGray rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary text-greySubText"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="pl-10 w-full border border-lightGray rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary text-greySubText"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Volume Range Filter with Slider */}
                            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-darkGray">Volume Total Range</label>
                                    <div className="text-xs text-greySubText">
                                        {filterMinVolume || '0'} - {filterMaxVolume || '5000'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            step="1"
                                            value={filterMinVolume || 0}
                                            onChange={(e) => setFilterMinVolume(e.target.value)}
                                            className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <p className="text-xs text-greySubText mt-1">Min Volume</p>
                                    </div>
                                    <div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5000"
                                            step="1"
                                            value={filterMaxVolume || 5000}
                                            onChange={(e) => setFilterMaxVolume(e.target.value)}
                                            className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <p className="text-xs text-greySubText mt-1">Max Volume</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Cota Lida Range with Slider */}
                            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-darkGray">Cota Lida Range</label>
                                    <div className="text-xs text-greySubText">
                                        {filterMinCotaLida || '0'} - {filterMaxCotaLida || '1000'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000"
                                            step="10"
                                            value={filterMinCotaLida || 0}
                                            onChange={(e) => setFilterMinCotaLida(e.target.value)}
                                            className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <p className="text-xs text-greySubText mt-1">Min Cota Lida</p>
                                    </div>
                                    <div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000"
                                            step="10"
                                            value={filterMaxCotaLida || 1000}
                                            onChange={(e) => setFilterMaxCotaLida(e.target.value)}
                                            className="w-full h-2 bg-gray200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <p className="text-xs text-greySubText mt-1">Max Cota Lida</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Enchimento with visual slider */}
                            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-darkGray">Enchimento Range (0-1)</label>
                                    <div className="text-xs text-greySubText">
                                        {filterMinEnchimento || '0'} - {filterMaxEnchimento || '1'}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="relative pt-1">
                                        <div className="h-1 bg-gray200 rounded-full">
                                            <div 
                                                className="absolute h-1 rounded-full bg-primary" 
                                                style={{ 
                                                    left: `${Number(filterMinEnchimento || 0) * 100}%`, 
                                                    width: `${(Number(filterMaxEnchimento || 1) - Number(filterMinEnchimento || 0)) * 100}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <input 
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={filterMinEnchimento || 0}
                                            onChange={(e) => setFilterMinEnchimento(e.target.value)}
                                            className="absolute w-full h-1 opacity-0 cursor-pointer"
                                        />
                                        <input 
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={filterMaxEnchimento || 1}
                                            onChange={(e) => setFilterMaxEnchimento(e.target.value)}
                                            className="absolute w-full h-1 opacity-0 cursor-pointer"
                                        />
                                        <div className="relative mt-6">
                                            <div className="flex justify-between">
                                                <div>
                                                    <span className="inline-block w-6 h-6 rounded-full bg-primary"></span>
                                                    <span className="text-xs text-greySubText ml-1">Min: {Number(filterMinEnchimento || 0).toFixed(2)}</span>
                                                </div>
                                                <div>
                                                    <span className="inline-block w-6 h-6 rounded-full bg-primary"></span>
                                                    <span className="text-xs text-greySubText ml-1">Max: {Number(filterMaxEnchimento || 1).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Volume Util with toggle buttons */}
                            <div className="bg-backgroundColor p-4 rounded-lg shadow-sm">
                                <label className="block text-sm font-medium text-darkGray mb-2">Volume Util</label>
                                <div className="flex flex-col space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <label className="text-xs text-greySubText mb-1 block">Min Volume Util</label>
                                            <div className="flex">
                                                <button 
                                                    onClick={() => setFilterMinVolumeUtil("0")}
                                                    className={`flex-1 py-1 border border-r-0 rounded-l-md ${filterMinVolumeUtil === "0" ? "bg-primary text-white" : "bg-gray-100 text-greySubText"}`}
                                                >
                                                    Low
                                                </button>
                                                <button 
                                                    onClick={() => setFilterMinVolumeUtil("25")}
                                                    className={`flex-1 py-1 border border-r-0 ${filterMinVolumeUtil === "25" ? "bg-primary text-white" : "bg-gray-100 text-greySubText"}`}
                                                >
                                                    Med
                                                </button>
                                                <button 
                                                    onClick={() => setFilterMinVolumeUtil("50")}
                                                    className={`flex-1 py-1 border rounded-r-md ${filterMinVolumeUtil === "50" ? "bg-primary text-white" : "bg-gray-100 text-greySubText"}`}
                                                >
                                                    High
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-greySubText mb-1 block">Max Volume Util</label>
                                            <div className="flex">
                                                <button 
                                                    onClick={() => setFilterMaxVolumeUtil("50")}
                                                    className={`flex-1 py-1 border border-r-0 rounded-l-md ${filterMaxVolumeUtil === "50" ? "bg-primary text-white" : "bg-gray-100 text-greySubText"}`}
                                                >
                                                    Low
                                                </button>
                                                <button 
                                                    onClick={() => setFilterMaxVolumeUtil("75")}
                                                    className={`flex-1 py-1 border border-r-0 ${filterMaxVolumeUtil === "75" ? "bg-primary text-white" : "bg-gray-100 text-greySubText"}`}
                                                >
                                                    Med
                                                </button>
                                                <button 
                                                    onClick={() => setFilterMaxVolumeUtil("100")}
                                                    className={`flex-1 py-1 border rounded-r-md ${filterMaxVolumeUtil === "100" || !filterMaxVolumeUtil ? "bg-primary text-white" : "bg-gray-100 text-greySubText"}`}
                                                >
                                                    High
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center pt-1">
                                        <span className="text-xs text-greySubText">Or enter custom values:</span>
                                        <div className="grid grid-cols-2 gap-3 mt-1">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={filterMinVolumeUtil}
                                                onChange={(e) => setFilterMinVolumeUtil(e.target.value)}
                                                className="w-full border border-lightGray rounded-md shadow-sm px-3 py-1 text-sm focus:ring-primary focus:border-primary text-greySubText"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={filterMaxVolumeUtil}
                                                onChange={(e) => setFilterMaxVolumeUtil(e.target.value)}
                                                className="w-full border border-lightGray rounded-md shadow-sm px-3 py-1 text-sm focus:ring-primary focus:border-primary text-greySubText"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Filter actions - Apply and Reset */}
                            <div className="lg:col-span-2 flex justify-end space-x-3 pt-2">
                                <button 
                                    onClick={resetFilters}
                                    className="px-5 py-2 border border-lightGray rounded-md text-sm font-medium text-darkGray bg-background hover:bg-gray-50"
                                >
                                    Clear All
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(1)} /* Reset to page 1 when filters change */
                                    className="px-5 py-2 bg-primary hover:bg-opacity-90 text-white font-medium rounded-md text-sm flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="bg-gray100 text-left text-darkGray">
                            <th className="pl-6 py-3 text-xs font-semibold uppercase tracking-wider">#</th>
                            <th 
                                className="py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray200"
                                onClick={() => handleSort("barragem")}
                            >
                                <div className="flex items-center">
                                    Dam
                                    {sortField === "barragem" && (
                                        <span className="ml-1">
                                            {sortDirection === "lowest" ? "↓" : "↑"}
                                        </span>
                                    )}
                                    {sortField !== "barragem" && (
                                        <span className="ml-1 text-gray400">↕</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray200"
                                onClick={() => handleSort("_time")}
                            >
                                <div className="flex items-center">
                                    Date
                                    {sortField === "_time" && (
                                        <span className="ml-1">
                                            {sortDirection === "lowest" ? "↓" : "↑"}
                                        </span>
                                    )}
                                    {sortField !== "_time" && (
                                        <span className="ml-1 text-gray400">↕</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="py-3 text-xs font-semibold uppercase tracking-wider text-right cursor-pointer hover:bg-gray200"
                                onClick={() => handleSort("cota_lida")}
                            >
                                <div className="flex items-center justify-end">
                                    Cota Lida
                                    {sortField === "cota_lida" && (
                                        <span className="ml-1">
                                            {sortDirection === "lowest" ? "↓" : "↑"}
                                        </span>
                                    )}
                                    {sortField !== "cota_lida" && (
                                        <span className="ml-1 text-gray400">↕</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="py-3 text-xs font-semibold uppercase tracking-wider text-right cursor-pointer hover:bg-gray200"
                                onClick={() => handleSort("enchimento")}
                            >
                                <div className="flex items-center justify-end">
                                    Enchimento
                                    {sortField === "enchimento" && (
                                        <span className="ml-1">
                                            {sortDirection === "lowest" ? "↓" : "↑"}
                                        </span>
                                    )}
                                    {sortField !== "enchimento" && (
                                        <span className="ml-1 text-gray400">↕</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="py-3 text-xs font-semibold uppercase tracking-wider text-right cursor-pointer hover:bg-gray200"
                                onClick={() => handleSort("volume_total")}
                            >
                                <div className="flex items-center justify-end">
                                    Volume Total
                                    {sortField === "volume_total" && (
                                        <span className="ml-1">
                                            {sortDirection === "lowest" ? "↓" : "↑"}
                                        </span>
                                    )}
                                    {sortField !== "volume_total" && (
                                        <span className="ml-1 text-gray400">↕</span>
                                    )}
                                </div>
                            </th>
                            <th 
                                className="pr-6 py-3 text-xs font-semibold uppercase tracking-wider text-right cursor-pointer hover:bg-gray200"
                                onClick={() => handleSort("volume_util")}
                            >
                                <div className="flex items-center justify-end">
                                    Volume Util
                                    {sortField === "volume_util" && (
                                        <span className="ml-1">
                                            {sortDirection === "lowest" ? "↓" : "↑"}
                                        </span>
                                    )}
                                    {sortField !== "volume_util" && (
                                        <span className="ml-1 text-gray400">↕</span>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                        <tbody className="divide-y divide-lightGray">
                            {currentRecords.map((record, index) => {
                                // Enchimento goes from 0.0 to 1.0, not 100
                                const enchimentoPercentage = record.enchimento !== null && record.enchimento !== undefined 
                                    ? Math.min(Number(record.enchimento) * 100, 100) // Convert 0-1 to 0-100%
                                    : 0;

                                const getBarColor = (percentage: number): string => {
                                    if (percentage > 70) return "bg-green-500"; // Full
                                    if (percentage > 40) return "bg-yellow-500"; // Moderate
                                    if (percentage > 20) return "bg-orange-500"; // Low
                                    return "bg-red-500"; // Critical
                                };
                                
                                return (
                                    <tr key={index} className={index % 2 === 0 ? "bg-gray50" : "bg-backgroundColor"}>
                                        <td className="pl-6 py-4 whitespace-nowrap text-sm text-greySubText">{startIndex + index + 1}</td>
                                        <td className="py-4 whitespace-nowrap w-60">
                                            <div className="font-medium text-darkGray">{record.barragem || 'N/A'}</div>
                                        </td>
                                        <td className="py-4 whitespace-nowrap text-sm text-greySubText">
                                            {formatDate(record._time)}
                                        </td>
                                        <td className="py-4 whitespace-nowrap text-sm text-right text-greySubText">
                                            {record.cota_lida !== null && record.cota_lida !== undefined
                                                ? Number(record.cota_lida).toFixed(2)
                                                : 'N/A'}
                                        </td>
                                        <td className="py-4 whitespace-nowrap text-sm text-right">
                                            {record.enchimento !== null && record.enchimento !== undefined ? (
                                                <div className="flex items-center justify-end">
                                                    <span className="text-greySubText mr-2">{Number(record.enchimento).toFixed(2)}</span>
                                                    <div className="w-16 bg-lightGray rounded-full h-2.5">
                                                        <div 
                                                            className={`${getBarColor(enchimentoPercentage)} h-2.5 rounded-full`}
                                                            style={{ width: `${enchimentoPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="py-4 whitespace-nowrap text-right">
                                            {record.volume_total !== null && record.volume_total !== undefined ? (
                                                <div className="flex items-center justify-end">
                                                    <span className="text-darkGray font-medium">{Number(record.volume_total).toFixed(2)}</span>
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="pr-6 py-4 whitespace-nowrap text-sm text-right text-greySubText">
                                            {record.volume_util !== null && record.volume_util !== undefined
                                                ? Number(record.volume_util).toFixed(2)
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {filteredData.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-greySubText">No records match your filter criteria.</p>
                        <button 
                            onClick={resetFilters}
                            className="mt-2 text-primary hover:text-opacity-80 font-medium"
                        >
                            Reset filters
                        </button>
                    </div>
                )}
                
                {/* Pagination controls with improved input handling */}
                <div className="bg-backgroundColor px-6 py-4 border-t border-lightGray flex items-center justify-between">
                    <div className="text-sm text-greySubText">
                        {filteredData.length > 0 ? (
                            <>
                                Showing (<span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span>) of <span className="font-medium">{filteredData.length}</span> results
                            </>
                        ) : (
                            <span>No results to display</span>
                        )}
                    </div>
                    
                    {filteredData.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-lightGray rounded-md text-sm font-medium text-darkGray bg-background hover:bg-gray50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={currentPage}
                                    onChange={handlePageChange}
                                    className="w-20 text-center border border-lightGray rounded-md shadow-sm px-3 py-2 text-sm text-darkGray bg-background"
                                    min={1}
                                    max={totalPages}
                                    onBlur={(e) => {
                                        // Ensure value is valid when input loses focus
                                        const value = parseInt(e.target.value);
                                        if (isNaN(value) || value < 1) {
                                            setCurrentPage(1);
                                        } else if (value > totalPages) {
                                            setCurrentPage(totalPages);
                                        }
                                    }}
                                />
                                <span className="ml-2 text-gray700 text-sm">of {totalPages}</span>
                            </div>

                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-4 py-2 border border-lightGray rounded-md text-sm font-medium text-darkGray bg-background hover:bg-gray50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <DamTable />
    );
}