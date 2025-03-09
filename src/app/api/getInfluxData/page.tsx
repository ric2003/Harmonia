"use client"
import { useEffect, useState } from "react";
import { getInfluxData } from "./influx";

interface QueryResult {
    _time: string;
    barragem: string;
    [key: string]: string | number | boolean | null | undefined;
}

export default function InfluxData() {
    const [data, setData] = useState<QueryResult[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    async function getInfluxDataFromQuery() {
        try {
            setLoading(true);
            // Call the async function and await its response
            const response = await getInfluxData();
            
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
        getInfluxDataFromQuery();
    }, []);

    useEffect(() => {
        console.log(data);
    }, [data]);

    if (loading) return <div className="p-10 text-center text-darkGray">Loading dam data...</div>;
    
    if (error) return (
        <div style={{ 
            padding: '16px', 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#b91c1c',
            margin: '20px 0'
        }}>
            Error: {error}
        </div>
    );
    
    if (data.length === 0) return <div className="p-10 text-center text-darkGray">No dam data available</div>;

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

    const DamTable = () => {
        const [currentPage, setCurrentPage] = useState(1);
        const recordsPerPage = 10; // Change this number as needed

        // Estados dos filtros
        const [filterDam, setFilterDam] = useState("");
        const [filterDate, setFilterDate] = useState("");
        const [filterMinVolume, setFilterMinVolume] = useState("");

        // Filtragem dos dados
        const filteredData = data.filter((record) => {
            const matchesDam = filterDam.trim() === "" || record.barragem?.toLowerCase().includes(filterDam.trim().toLowerCase());
            const matchesDate = filterDate === "" || formatDate(new Date(record._time).toISOString()) === filterDate.split("-").reverse().join("-");
            const matchesMinVolume = filterMinVolume === "" ||
                (record.volume_total !== null && Number(record.volume_total) >= Number(filterMinVolume));

            return matchesDam && matchesDate && matchesMinVolume;
        });
    
        const totalPages = Math.ceil(filteredData.length / recordsPerPage);
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const currentRecords = filteredData.slice(startIndex, endIndex);

        const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const pageNumber = Number(value);
        
            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
              setCurrentPage(pageNumber);
            }
        };
    
        return (
            <div className="my-5">
                <div className="flex flex-row justify-between items-center mb-4">
                    <div className="flex flex-row items-center space-x-2">
                        <h2 className="text-darkGray text-2xl font-bold">Dam Monitoring Data</h2>

                        <div className="space-x-2">
                            <input
                                type="text"
                                placeholder="Filtrar por barragem"
                                value={filterDam}
                                onChange={(e) => setFilterDam(e.target.value)}
                                className="border px-3 py-2 rounded text-primary"
                            />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="border px-3 py-2 rounded text-primary"
                            />
                            <input
                                type="number"
                                placeholder="Volume mínimo"
                                value={filterMinVolume}
                                onChange={(e) => setFilterMinVolume(e.target.value)}
                                className="border px-3 py-2 rounded text-primary"
                            />
                        </div>
                    </div>
                    <div className="flex justify-center space-x-4 items-center">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>

                        <div>
                            <input
                                type="number"
                                value={currentPage}
                                onChange={handlePageChange}
                                className="w-16 text-center border border-primary rounded text-primary"
                                min={1}
                                max={totalPages}
                            />

                            <span className="pl-2 text-primary">of {totalPages}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
                
                <table className="w-full mt-5 border-collapse table-fixed">
                    <thead>
                        <tr className="bg-darkGray font-bold text-left text-white">
                            <th className="pl-3 py-4 w-24">Linha</th>
                            <th className="py-4 w-auto">Dam</th>
                            <th className="py-4 w-28">Date</th>
                            <th className="py-4 text-right w-40">Cota Lida</th>
                            <th className="py-4 text-right w-40">Enchimento</th>
                            <th className="py-4 text-right w-40">Volume Total</th>
                            <th className="pr-3 py-4 text-right w-40">Volume Util</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map((record, index) => (
                            <tr key={index} className={`border-b border-white font-bold ${index % 2 == 0 ? "bg-primary" : "bg-blue-500"}`}>
                                <td className="pl-3 py-4 w-24">{index + 1}</td>
                                <td className="py-4">{record.barragem || 'N/A'}</td>
                                <td className="py-4 w-24">{formatDate(record._time)}</td>
                                
                                <td className="py-4 text-right">
                                {record.cota_lida !== null && record.cota_lida !== undefined
                                    ? Number(record.cota_lida).toFixed(2)
                                    : 'N/A'}
                                </td>
                                <td className="py-4 text-right">
                                {record.enchimento !== null && record.enchimento !== undefined
                                    ? Number(record.enchimento).toFixed(2)
                                    : 'N/A'}
                                </td>
                                <td className="py-4 text-right">
                                {record.volume_total !== null && record.volume_total !== undefined
                                    ? Number(record.volume_total).toFixed(2)
                                    : 'N/A'}
                                </td>
                                <td className="pr-3 py-4 text-right">
                                {record.volume_util !== null && record.volume_util !== undefined
                                    ? Number(record.volume_util).toFixed(2)
                                    : 'N/A'}
                                </td>
    
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    
    return (
        <DamTable />
    );
}