let booksData = [];
let bulkResults = [];

// Single ISBN search
document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const isbn = document.getElementById('isbn').value;
    if (isValidISBN13(isbn)) {
        searchISBN(isbn);
    } else {
        showInvalidISBNFeedback();
    }
});

document.getElementById('isbn').addEventListener('input', function(e) {
    const isbn = e.target.value.replace(/[-\s]/g, '');
    const isValid = isValidISBN13(isbn);
    e.target.classList.toggle('is-valid', isValid);
    e.target.classList.toggle('is-invalid', !isValid);
    document.getElementById('isbn-feedback').style.display = isValid ? 'none' : 'block';
    document.getElementById('search-button').disabled = !isValid;
});

document.getElementById('isbn').addEventListener('click', function(e) {
    e.target.select();
});

document.getElementById('clear-button').addEventListener('click', function() {
    clearSingleSearch();
});

// Bulk ISBN search
document.getElementById('bulk-search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    if (file) {
        if (file.name.endsWith('.csv')) {
            processCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            processExcel(file);
        } else {
            alert('Unsupported file type. Please upload a CSV or Excel file.');
        }
    }
});

document.getElementById('bulk-clear-button').addEventListener('click', function() {
    clearBulkUpload();
});

document.getElementById('download-button').addEventListener('click', function() {
    downloadResults();
});

// Fetch ISBN data
async function fetchData() {
    try {
        const response = await fetch('data.json');
        booksData = await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Single ISBN search function
function searchISBN(isbn) {
    const result = booksData.find(book => book.code === isbn);
    
    let resultHTML = '';
    if (result) {
        resultHTML = `
            <div class="alert result-success">
                <p><strong>ISBN:</strong> ${result.code}</p>
                <p><strong>Description:</strong> ${result.description}</p>
                <p><strong>Setup Date:</strong> ${result.setupdate}</p>
            </div>
        `;
    } else {
        resultHTML = '<div class="alert result-warning">Item not available for POD</div>';
    }
    
    document.getElementById('result').innerHTML = resultHTML;
}

// ISBN-13 validation function
function isValidISBN13(isbn) {
    isbn = isbn.replace(/[-\s]/g, '');
    
    if (isbn.length !== 13 || !/^\d{13}$/.test(isbn)) {
        return false;
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += (i % 2 === 0) ? parseInt(isbn[i]) : parseInt(isbn[i]) * 3;
    }
    
    let checksum = (10 - (sum % 10)) % 10;
    return isbn[12] === checksum.toString();
}

// Show feedback for invalid ISBN
function showInvalidISBNFeedback() {
    document.getElementById('isbn').classList.add('is-invalid');
    document.getElementById('isbn-feedback').style.display = 'block';
}

// Process CSV file for bulk search
function processCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const isbns = content.split(/\r\n|\n/).filter(isbn => isbn.trim() !== '');
        processBulkISBNs(isbns);
    };
    reader.readAsText(file);
}

// Process Excel file for bulk search
function processExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const isbns = XLSX.utils.sheet_to_json(worksheet, {header: 1})
            .flat()
            .filter(isbn => isbn && isbn.toString().trim() !== '');
        processBulkISBNs(isbns);
    };
    reader.readAsArrayBuffer(file);
}

// Process bulk ISBNs
function processBulkISBNs(isbns) {
    let resultHTML = '<table class="table"><thead><tr><th>ISBN</th><th>Status</th></tr></thead><tbody>';
    bulkResults = []; // Clear previous results
    
    isbns.forEach(isbn => {
        isbn = isbn.toString().replace(/[-\s]/g, '');
        let status, statusClass;
        if (isValidISBN13(isbn)) {
            const result = booksData.find(book => book.code === isbn);
            status = result ? 'Available for POD' : 'Not available for POD';
            statusClass = result ? 'text-success' : 'text-danger';
        } else {
            status = 'Invalid ISBN';
            statusClass = 'text-warning';
        }
        resultHTML += `<tr><td>${isbn}</td><td class="${statusClass}">${status}</td></tr>`;
        bulkResults.push({ isbn, status });
    });
    
    resultHTML += '</tbody></table>';
    document.getElementById('bulk-result').innerHTML = resultHTML;
    document.getElementById('download-button').disabled = false;
}

// Clear single search
function clearSingleSearch() {
    const isbnInput = document.getElementById('isbn');
    isbnInput.value = '';
    isbnInput.classList.remove('is-valid', 'is-invalid');
    document.getElementById('isbn-feedback').style.display = 'none';
    document.getElementById('search-button').disabled = true;
    document.getElementById('result').innerHTML = '';
}

// Clear bulk upload
function clearBulkUpload() {
    document.getElementById('file-upload').value = '';
    document.getElementById('bulk-result').innerHTML = '';
    document.getElementById('download-button').disabled = true;
    bulkResults = [];
}

// Download results as CSV
function downloadResults() {
    if (bulkResults.length === 0) return;

    const csv = 'ISBN,Status\n' + bulkResults.map(result => `${result.isbn},"${result.status}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "isbn_results.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Fetch data when the page loads
fetchData();
