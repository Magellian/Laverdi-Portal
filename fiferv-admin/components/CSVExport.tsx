'use client';

interface CSVExportProps {
  data: any[];
  filename: string;
}

export default function CSVExport({ data, filename }: CSVExportProps) {
  const generateCSV = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const headerRow = headers.map(h => `"${h}"`).join(',');
    
    // Create data rows
    const dataRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        
        // Handle special cases
        if (value === null || value === undefined) {
          return '';
        }
        
        // Escape quotes in strings
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',')
    );
    
    // Combine header and data
    const csv = [headerRow, ...dataRows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={generateCSV}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
    >
      📥 Export CSV
    </button>
  );
}
