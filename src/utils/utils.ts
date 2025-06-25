// Function to format the date in dd/mm/yyyy
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

// Helper function to format values (optional but useful)
export const formatValue = (value: number | string | undefined | null, decimalPlaces: number = 2): string => {
  if (value === null || value === undefined) return 'N/A';
  const num = Number(value);
  if (isNaN(num)) return 'N/A';
  return num.toFixed(decimalPlaces);
}; 