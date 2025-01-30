"use client"
import { useState } from "react";

export default function Excel() {
    function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        if(event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
        }
    }

    return (
        <div>
            <input onChange={handleFileUpload} type="file" id="fileInput" accept=".xlsx" />
            <button className="bg-primary text-white">Carregar Dados</button>
        </div>
    );
}