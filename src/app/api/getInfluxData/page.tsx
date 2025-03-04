"use client"
import { useEffect, useState } from "react";
import { getInfluxData } from "./influx";

interface QueryResult {
    _time?: string;
    [key: string]: string | number | boolean | null | undefined;
}

/*export default function InfluxData() {
    const [data, setData] = useState<QueryResult[]>([]);

    async function getInfluxDataFromQuery() {
        // Assuming the API returns an object where each value is a Station
        const importedData = getInfluxData();
        setData(Object.values(importedData) as QueryResult[]);
    }

    useEffect(() => {
        getInfluxDataFromQuery();
    }, []);

    useEffect(() => {
        console.log(data);
    }, [data])

    return (
        <div>
            <table>
                {data.map((line) => {
                    return (
                        <tr>
                            <td>{line.barragem}</td>
                            <td>{line._time}</td>
                            <td>{line.cota_lida}</td>
                        </tr>
                    );
                })}
            </table>
        </div>
    );
}
*/

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

    // Helper function to safely format date
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return dateString;
        }
    };

    return (
        <div className="my-5">
            <h2 className="mb-4 text-darkGray text-2xl font-bold">Dam Monitoring Data</h2>
            
            <table className="w-full mt-5 border-collapse">
                <thead>
                    <tr className="bg-darkGray font-bold text-left text-white">
                        <th className="px-3 py-4">Dam</th>
                        <th className="px-3 py-4">Date</th>
                        <th className="px-3 py-4 text-right">Cota Lida</th>
                        <th className="px-3 py-4 text-right">Enchimento</th>
                        <th className="px-3 py-4 text-right">Volume Total</th>
                        <th className="px-3 py-4 text-right">Volume Util</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((record, index) => (
                        <tr key={index} className={`border-b border-white font-bold ${index % 2 == 0 ? "bg-primary" : "bg-blue-500"}`}>
                            <td className="px-3 py-4">{record.barragem || 'N/A'}</td>
                            <td className="px-3 py-4">{formatDate(record._time)}</td>
                            <td className="px-3 py-4 text-right">
                                {record.cota_lida ? Number(record.cota_lida).toFixed(2) : 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-right">
                                {record.enchimento ? Number(record.enchimento).toFixed(2) : 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-right">
                                {record.volume_total ? Number(record.volume_total).toFixed(2) : 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-right">
                                {record.volume_util ? Number(record.volume_util).toFixed(2) : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}