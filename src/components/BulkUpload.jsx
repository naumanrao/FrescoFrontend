import React, { useState, useContext } from "react";
import { useDropzone } from "react-dropzone";
import readXlsxFile from "read-excel-file";
import AuthContext from "../AuthContext";
import { BASE_URL } from "../config";

const ALLOWED_BULK_UNITS = ['kg', 'g', 'L', 'mL'];
const ALLOWED_UNIT_TYPES = ['bulk', 'discrete'];

export default function BulkUpload({ closeModal, handlePageUpdate }) {
  const { user, token } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [uploadType, setUploadType] = useState('raw');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      
      setUploading(true);
      setErrors([]);

      try {
        const rows = await readXlsxFile(acceptedFiles[0]);
        const validationErrors = [];
        const payload = {
          type: uploadType,
          userId: user,
          items: []
        };

        if (uploadType === 'raw') {
          const expectedHeaders = ["Name", "Manufacturer", "Stock", "UnitType", "Size", "Description", "Price"];
          validateHeaders(rows[0], expectedHeaders);

          rows.slice(1).forEach((row, index) => {
            const { item, errors } = processRawMaterialRow(row, index + 2);
            if (errors.length) validationErrors.push(...errors);
            else payload.items.push(item);
          });
        } else {
          const expectedHeaders = ["Name", "Manufacturer", "Stock", "Price", "Ingredients"];
          validateHeaders(rows[0], expectedHeaders);

          rows.slice(1).forEach((row, index) => {
            const { item, errors } = processReadyProductRow(row, index + 2);
            if (errors.length) validationErrors.push(...errors);
            else payload.items.push(item);
          });
        }

        if (validationErrors.length) {
          throw new Error(validationErrors.join('\n'));
        }

  const response = await fetch(`${BASE_URL}/api/product/bulk-upload`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Upload failed: ${response.statusText}`);
        }

        handlePageUpdate();
        closeModal();
      } catch (error) {
        setErrors(error.message.split('\n'));
      } finally {
        setUploading(false);
      }
    }
  });

  const processRawMaterialRow = (row, rowNum) => {
    const errors = [];
    console.log(`Processing row ${rowNum}:`, row); // Debugging log
  
    const item = {
      name: row[0]?.toString().trim(),
      manufacturer: row[1]?.toString().trim(),
      stock: Number(row[2]),
      unitType: row[3]?.toString().trim().toLowerCase(),
      size: row[4] ? row[4].toString().trim() : "", // Ensure it's a string and not undefined
      description: row[5]?.toString().trim(),
      price: Number(row[6]) || 0,
      type: 'raw'
    };
  
    if (!item.name) errors.push(`Row ${rowNum}: Name is required`);
    if (!item.manufacturer) errors.push(`Row ${rowNum}: Manufacturer is required`);
    if (isNaN(item.stock) || item.stock < 0) errors.push(`Row ${rowNum}: Invalid stock value`);
  
    // Validate Unit Type
    if (!ALLOWED_UNIT_TYPES.includes(item.unitType)) {
      errors.push(`Row ${rowNum}: Invalid unit type - must be 'bulk' or 'discrete'`);
    }
  
    // Validate Size for Bulk Items
    if (item.unitType === 'bulk') {
      const normalizedSize = item.size; // Convert to lowercase
      if (!ALLOWED_BULK_UNITS.includes(normalizedSize)) {
        errors.push(`Row ${rowNum}: Invalid bulk unit '${item.size}' - allowed: ${ALLOWED_BULK_UNITS.join(', ')}`);
      }
    } else {
      item.size = 'units'; // Default for discrete items
    }
  
    return { item, errors };
  };
  

  const processReadyProductRow = (row, rowNum) => {
    const errors = [];
    const item = {
      name: row[0]?.toString().trim(),
      manufacturer: row[1]?.toString().trim(),
      stock: Number(row[2]),
      price: Number(row[3]) || 0,
      ingredients: tryParseIngredients(row[4]),
      type: 'ready'
    };

    // Validate ingredients
    if (!item.ingredients || !Array.isArray(item.ingredients)) {
      errors.push(`Row ${rowNum}: Invalid ingredients format`);
    } else {
      item.ingredients.forEach((ing, idx) => {
        if (!ing.material || !ing.quantity || isNaN(ing.quantity) || isNaN(ing.waste)) {
          errors.push(`Row ${rowNum}: Ingredient ${idx + 1} has invalid data`);
        }
      });
    }

    return { item, errors };
  };

  const tryParseIngredients = (ingredientsString) => {
    try {
      return JSON.parse(ingredientsString);
    } catch (error) {
      return null;
    }
  };

  const validateHeaders = (headerRow, expected) => {
    if (!headerRow || headerRow.join('|') !== expected.join('|')) {
      throw new Error(`Invalid headers. Expected: ${expected.join(', ')}`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value)}
          className="mb-4 p-2 border rounded"
        >
          <option value="raw">Upload Raw Materials</option>
          <option value="ready">Upload Ready Products</option>
        </select>

        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
          <input {...getInputProps()} />
          <p className="text-gray-600">
            {isDragActive ? "Drop Excel file here" : "Drag & drop Excel file, or click to select"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {uploadType === 'raw' ? 
              "Template columns: Name, Manufacturer, Stock, UnitType (bulk/discrete), Size, Description, Price" :
              "Template columns: Name, Manufacturer, Stock, Price, Ingredients (JSON array)"
            }
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg max-h-40 overflow-y-auto">
          {errors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">• {error}</p>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={closeModal}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          disabled={uploading}
        >
          Cancel
        </button>
        {uploading && <span className="text-gray-500">Uploading...</span>}
      </div>
    </div>
  );
}