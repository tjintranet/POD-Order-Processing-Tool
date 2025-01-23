// Global variables
let booksData = [];
let processedOrders = [];
let customerConfig = {};

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

async function loadCustomerConfig() {
    try {
        const response = await fetch('customer-config.json');
        customerConfig = await response.json();
    } catch (error) {
        console.error('Error loading customer config:', error);
        showStatus('Error loading customer configuration', 'danger');
    }
}

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
        const workbook = XLSX.read(arrayBuffer, {
            type: 'array',
            cellText: false,
            cellDates: true
        });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: ''
        });

        if (excelData.length > 0 && typeof excelData[0][0] === 'string') {
            excelData.shift();
        }

        const booksMap = new Map(booksData.map(item => [item.code, item]));

        processedOrders = excelData.map((row, index) => {
            let isbn = String(row[0] || '');
            if (isbn.includes('e')) {
                isbn = Number(isbn).toFixed(0);
            }
            isbn = isbn.replace(/\D/g, '').padStart(13, '0');
            const quantity = parseInt(row[1]) || 0;
            const stockItem = booksMap.get(isbn);
            
            return {
                lineNumber: String(index + 1).padStart(3, '0'),
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
            <td>${order.lineNumber}</td>
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

function formatDate() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function deleteRow(index) {
    processedOrders.splice(index, 1);
    processedOrders = processedOrders.map((order, idx) => ({
        ...order,
        lineNumber: String(idx + 1).padStart(3, '0')
    }));
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

    const customerType = document.getElementById('customerType').value;
    if (!customerType || !customerConfig[customerType]) {
        showStatus('Please select a valid customer type', 'warning');
        return;
    }

    try {
        const customer = customerConfig[customerType];
        const formattedDate = formatDate();
        const orderRef = document.getElementById('orderRef').value;

        const csvRow = customer.csvStructure.map(field => {
            switch(field) {
                case 'HDR':
                    return 'HDR';
                case 'orderNumber':
                    return orderRef;
                case 'date':
                    return formattedDate;
                case 'code':
                    return customer.headerCode || '';
                case 'type':
                    return customer.type || '';
                case 'companyName':
                    return customer.name;
                case 'phone':
                    return customer.phone;
                default:
                    return customer.address[field] || '';
            }
        });

        const csvContent = [csvRow];
        
        processedOrders.forEach(order => {
            const dtlRow = Array(customer.csvStructure.length).fill('');
            dtlRow[0] = 'DTL';
            dtlRow[2] = order.lineNumber;
            dtlRow[3] = order.isbn;
            dtlRow[4] = order.quantity.toString();
            csvContent.push(dtlRow);
        });

        const csv = Papa.unparse(csvContent);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const filename = `pod_order_${now.getFullYear()}_${
            String(now.getMonth() + 1).padStart(2, '0')}_${
            String(now.getDate()).padStart(2, '0')}_${
            String(now.getHours()).padStart(2, '0')}_${
            String(now.getMinutes()).padStart(2, '0')}_${
            String(now.getSeconds()).padStart(2, '0')}.csv`;
        a.download = filename;
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

async function downloadTemplate() {
    try {
        const response = await fetch('order_template.xlsx');
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

    processedOrders = processedOrders.map((order, idx) => ({
        ...order,
        lineNumber: String(idx + 1).padStart(3, '0')
    }));

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

fetchData();
loadCustomerConfig();