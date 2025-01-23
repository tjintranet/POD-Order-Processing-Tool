# POD Order Processing Tool

A web-based tool for processing Print On Demand (POD) orders, validating ISBNs against inventory, and generating customer-specific CSV outputs.

## Features

- Excel file upload for order processing
- ISBN validation against inventory database
- Dynamic order preview with status indicators
- Customer-specific CSV export
- Clipboard copy functionality for email reporting
- Order template download
- Bulk row deletion
- Line number auto-generation

## Setup

1. Place files in a web server directory:
   ```
   index.html
   script.js
   customer-config.json
   data.json
   order_template.xlsx
   ```

2. Configure `customer-config.json` with customer details:
   ```json
   {
     "customerName": {
       "name": "Company Name",
       "address": {
         "street": "Street",
         "city": "City",
         "region": "Region",
         "country": "Country",
         "postcode": "Postcode",
         "countryCode": "CC"
       },
       "phone": "Phone",
       "headerCode": "Code",
       "csvStructure": ["HDR", "orderNumber", "date", ...]
     }
   }
   ```

3. Ensure `data.json` contains valid ISBN inventory.

## Usage

1. Enter order reference
2. Select customer type
3. Upload Excel file
4. Review order details in preview table
5. Download CSV or copy table for email

## Excel Template Format

Required columns:
- ISBN: Product identifier
- Qty: Order quantity

## Dependencies

- Bootstrap 5.3.2
- Font Awesome 6.4.0
- SheetJS 0.18.5
- PapaParse 5.4.1

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Error Handling

- Validates order reference
- Checks customer selection
- Validates ISBN format
- Reports processing errors
- Shows success/failure notifications

## Adding New Customers

1. Add customer entry to `customer-config.json`
2. Add option to customer select dropdown in `index.html`
3. Customer configuration requires:
   - Company details
   - Address information
   - CSV structure definition
   - Header code or type identifier