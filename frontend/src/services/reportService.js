import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// Get daily reports data
export const getDailyReports = async (filters = {}) => {
  try {
    const token = localStorage.getItem('access_token');
    
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.employee) params.append('emp_id', filters.employee);
    if (filters.date) {
      // Convert date format from YYYY-MM-DD to DD-MM-YYYY if needed
      const dateObj = new Date(filters.date);
      const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
      params.append('date', formattedDate);
    }
    if (filters.project) params.append('project', filters.project);
    
    const response = await axios.get(`http://localhost:8000/api/daily-reports/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    throw error;
  }
};

// Export daily report to different formats
export const exportDailyReport = async (format, filters) => {
  try {
    // First, get the report data using the existing endpoint
    const reportData = await getDailyReports(filters);
    
    if (!reportData || reportData.length === 0) {
      throw new Error('No data available to export');
    }
    
    // Generate filename with date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const fileName = `daily-report-${dateStr}`;
    
    // Export based on format
    switch (format.toLowerCase()) {
      case 'excel':
        return exportToExcel(reportData, fileName);
      case 'pdf':
        return exportToPdf(reportData, fileName);
      case 'word':
        return exportToWord(reportData, fileName);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error(`Failed to export report as ${format}:`, error);
    throw error;
  }
};

// Helper function to export to Excel
const exportToExcel = async (data, fileName) => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Save file using Electron if available, otherwise use browser
    if (window.electronAPI && window.electronAPI.saveFile) {
      const result = await window.electronAPI.saveFile({
        fileName: `${fileName}.xlsx`,
        fileData: excelBuffer,
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      });
      
      return { success: true, message: 'Excel file exported successfully', filePath: result.filePath };
    } else {
      // Browser fallback
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}.xlsx`);
      return { success: true, message: 'Excel file exported successfully' };
    }
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error(`Failed to export Excel: ${error.message}`);
  }
};

// Helper function to export to PDF
const exportToPdf = async (data, fileName) => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Daily Work Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableColumn = Object.keys(data[0]);
    const tableRows = data.map(item => Object.values(item));
    
    // Add table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Save file using Electron if available, otherwise use browser
    if (window.electronAPI && window.electronAPI.saveFile) {
      const pdfBuffer = doc.output('arraybuffer');
      
      const result = await window.electronAPI.saveFile({
        fileName: `${fileName}.pdf`,
        fileData: pdfBuffer,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });
      
      return { success: true, message: 'PDF file exported successfully', filePath: result.filePath };
    } else {
      // Browser fallback
      doc.save(`${fileName}.pdf`);
      return { success: true, message: 'PDF file exported successfully' };
    }
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
};

// Helper function to export to Word (DOCX)
const exportToWord = async (data, fileName) => {
  try {
    // Create a new document
    const doc = new Document();
    
    // Add title
    doc.addSection({
      properties: {},
      children: [
        new Paragraph({
          text: 'Daily Work Report',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Generated on: ${new Date().toLocaleDateString()}`,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }), // Empty paragraph for spacing
      ]
    });
    
    // Create table headers
    const headers = Object.keys(data[0]);
    
    // Create table rows
    const rows = data.map(item => {
      return new TableRow({
        children: Object.values(item).map(value => {
          return new TableCell({
            children: [new Paragraph({ text: value ? value.toString() : '' })],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 }
            }
          });
        })
      });
    });
    
    // Create header row
    const headerRow = new TableRow({
      children: headers.map(header => {
        return new TableCell({
          children: [new Paragraph({ text: header, bold: true })],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 }
          },
          shading: { fill: "CCCCCC" }
        });
      })
    });
    
    // Create table
    const table = new Table({
      rows: [headerRow, ...rows]
    });
    
    // Add table to document
    doc.addSection({
      children: [table]
    });
    
    // Generate DOCX file
    const buffer = await Packer.toBuffer(doc);
    
    // Save file using Electron if available, otherwise use browser
    if (window.electronAPI && window.electronAPI.saveFile) {
      const result = await window.electronAPI.saveFile({
        fileName: `${fileName}.docx`,
        fileData: buffer,
        filters: [{ name: 'Word Documents', extensions: ['docx'] }]
      });
      
      return { success: true, message: 'Word document exported successfully', filePath: result.filePath };
    } else {
      // Browser fallback
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${fileName}.docx`);
      return { success: true, message: 'Word document exported successfully' };
    }
  } catch (error) {
    console.error('Word export error:', error);
    throw new Error(`Failed to export Word document: ${error.message}`);
  }
};

// Get list of employees for reports
export const getEmployees = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`http://localhost:8000/api/employees/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Transform the data to match the expected format
    const employeeData = response.data.results || response.data;
    
    return employeeData.map(employee => ({
      id: employee.EmployeeID || employee.employee_id || employee.UserID || '',
      name: employee.EmployeeName || employee.name || employee.full_name || 
            `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

// Get list of projects for reports
export const getProjects = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${CONFIG.API_URL}/projects/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Transform the data to match the expected format
    const projectData = response.data.results || response.data;
    
    return projectData.map(project => ({
      id: project.ProjectID || project.project_id || project.id || '',
      name: project.Name || project.name || project.title || ''
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};
