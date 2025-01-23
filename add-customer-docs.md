# Adding New Customers to POD Order Processing Tool

## JSON Configuration (customer-config.json)

Add a new customer entry following this structure:

```json
"customerName": {
    "name": "Full Company Name",
    "address": {
        "street": "Street Address",
        "road": "Road Name",
        "city": "City",
        "region": "Region",
        "country": "Country",
        "postcode": "Postal Code",
        "countryCode": "Country Code"
    },
    "phone": "Phone Number",
    "headerCode": "Header Code (if required)",
    "type": "Type (if required)",
    "csvStructure": [
        "HDR", 
        "orderNumber", 
        "date", 
        "code/type", 
        "companyName", 
        "street", 
        "road", 
        "city", 
        "region", 
        "country", 
        "postcode", 
        "countryCode", 
        "phone"
    ]
}
```

## HTML Update (index.html)

Add new option to customer select dropdown:

```html
<select class="form-control" id="customerType" required>
    <option value="">Select Customer</option>
    <option value="existingCustomer">Existing Customer Name</option>
    <option value="customerName">New Customer Name</option>
</select>
```

Important Notes:
- The `value` in the select option must match the customer key in JSON
- CSV structure defines column order in output file
- DTL rows always follow pattern: DTL (col 0), Line No (col 2), ISBN (col 3), Quantity (col 4)