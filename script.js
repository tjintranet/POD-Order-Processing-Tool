// Global variables
let booksData = [];
let processedOrders = [];

// Fetch ISBN data when page loads
async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        booksData = await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        showStatus('Error loading book data: ' + error.message, 'danger');
    }
}

// Handle file input change
document.getElementById('excelFile').addEventListener('change', handleFileSelect);

async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const orderRef = document.getElementById('orderRef').value.trim();
    const orderRefWarning = document.getElementById('orderRefWarning');

    if (!orderRef) {
        orderRefWarning.style.display = 'block';
        showStatus('Please enter an order reference before uploading a file', 'warning');
        document.getElementById('excelFile').value = '';
        return;
    }

    orderRefWarning.style.display = 'none';

    try {
        showStatus('Processing file...', 'info');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
        });

        if (excelData.length > 0 && typeof excelData[0][0] === 'string') {
            excelData.shift();
        }

        const booksMap = new Map(booksData.map(item => [item.code, item]));

        processedOrders = excelData.map(row => {
            let isbn = String(row[0] || '').replace(/\D/g, '').padStart(13, '0');
            const quantity = parseInt(row[1]) || 0;
            const stockItem = booksMap.get(isbn);

            return {
                orderRef,
                isbn,
                description: stockItem?.description || 'Not Found',
                quantity,
                available: !!stockItem,
                setupDate: stockItem?.setupdate || ''
            };
        });

        updatePreviewTable();
        showStatus('Data loaded successfully!', 'success');
        enableButtons(true);
    } catch (error) {
        console.error('Processing error:', error);
        showStatus('Error processing file. Please check the format and try again.', 'danger');
        enableButtons(false);
    }
}

function updatePreviewTable() {
    const tbody = document.getElementById('previewBody');
    tbody.innerHTML = '';

    if (processedOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No data loaded</td></tr>';
        return;
    }

    processedOrders.forEach((order, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox" data-index="${index}">
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteRow(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
            <td>${order.orderRef}</td>
            <td>${order.isbn}</td>
            <td>${order.description}</td>
            <td>${order.quantity}</td>
            <td>
                <span class="badge ${order.available ? 'bg-success' : 'bg-danger'}">
                    ${order.available ? 'Available' : 'Not Found'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteRow(index) {
    processedOrders.splice(index, 1);
    updatePreviewTable();
    showStatus(`Row ${index + 1} deleted`, 'info');
    enableButtons(processedOrders.length > 0);
}

function clearAll() {
    processedOrders = [];
    updatePreviewTable();
    document.getElementById('excelFile').value = '';
    document.getElementById('orderRef').value = '';
    showStatus('All data cleared', 'info');
    enableButtons(false);
}

function downloadCsv() {
    if (processedOrders.length === 0) {
        showStatus('No data to download', 'warning');
        return;
    }

    try {
        const csv = Papa.unparse(processedOrders);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pod_order_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showStatus('CSV downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showStatus('Error creating CSV file', 'danger');
    }
}

function downloadPdf() {
    if (processedOrders.length === 0) {
        showStatus('No data to download', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const orderRef = document.getElementById('orderRef').value;

        doc.setFontSize(16);
        doc.text('POD Order Details', 14, 20);
        doc.setFontSize(12);
        doc.text(`Order Reference: ${orderRef}`, 14, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);

        const tableData = processedOrders.map(order => [
            order.isbn,
            order.description,
            order.quantity.toString(),
            order.available ? 'Available' : 'Not Found'
        ]);

        doc.autoTable({
            startY: 50,
            head: [['ISBN', 'Description', 'Quantity', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 }
            }
        });

        const filename = `pod_order_${orderRef}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(filename);
        showStatus('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF error:', error);
        showStatus('Error creating PDF', 'danger');
    }
}

// Update enableButtons function to include pdfBtn
function enableButtons(enabled) {
    alert(`Buttons enabled: ${enabled}`);
    document.getElementById('clearBtn').disabled = !enabled;
    document.getElementById('downloadBtn').disabled = !enabled;
    document.getElementById('deleteSelectedBtn').disabled = !enabled;
    document.getElementById('pdfBtn').disabled = !enabled;
    document.getElementById('selectAll').checked = false;
}
}

async function downloadTemplate() {
    try {
        const response = await fetch('order_template.xlsx');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'order_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showStatus('Template downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading template:', error);
        showStatus('Error downloading template', 'danger');
    }
}

function enableButtons(enabled) {
    document.getElementById('clearBtn').disabled = !enabled;
    document.getElementById('downloadBtn').disabled = !enabled;
    document.getElementById('deleteSelectedBtn').disabled = !enabled;
    document.getElementById('selectAll').checked = false;
}

function toggleAllCheckboxes() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const selectAllCheckbox = document.getElementById('selectAll');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function deleteSelected() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    const indices = Array.from(checkboxes)
        .map(checkbox => parseInt(checkbox.dataset.index))
        .sort((a, b) => b - a);

    indices.forEach(index => {
        processedOrders.splice(index, 1);
    });

    updatePreviewTable();
    showStatus(`${indices.length} rows deleted`, 'info');
    enableButtons(processedOrders.length > 0);
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `alert alert-${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

// Initialize by fetching data
fetchData();
