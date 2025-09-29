import { useState } from "react";
import { BASE_URL } from "../config";
import {
  Button,
  Select,
  Option,
  Input,
  Textarea 
} from "@material-tailwind/react";
export default function RawMaterialForm({ authContext, onSuccess }) {
  const [rawMaterial, setRawMaterial] = useState({
    userID: authContext.user,
    name: "",
    unitType: "discrete",
    manufacturer: "",
    description: "",
    stock: 0,
    price: 0,
    size: "units",
  });

  const handleInputChange = (key, value) => {
    setRawMaterial(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
  const response = await fetch(`${BASE_URL}/api/product/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext.token}`,
        },
        body: JSON.stringify({
          ...rawMaterial,
          type: "raw",
          userID: authContext.user,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add raw material");
      
      alert("Raw material added successfully!");
      onSuccess();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid gap-4 mb-4 sm:grid-cols-2">
        {/* Name */}
        <div>
       
          <Input
          label="Raw Material Name"
            type="text"
            value={rawMaterial.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          
            required
            color="blue" 
          />
        </div>

        {/* Unit Type */}
        <div>
       
          <Select
          label="Unit Type"
         color="blue"
          value={rawMaterial.unitType}
          onChange={(val) => setRawMaterial({ ...rawMaterial, unitType: val })}
        >
          <Option value="discrete">Individual Items</Option>
          <Option value="bulk">Bulk Material</Option>
        </Select>
        </div>

        {/* Size (Conditional) */}
        {rawMaterial.unitType === "bulk" && (
          <div>
     
          <Select
          label="Unit Size"
            color="blue"
            value={rawMaterial.size}
            onChange={(val) => setRawMaterial({ ...rawMaterial, size: val })}
          >
            <Option value="kg">Kilograms (kg)</Option>
            <Option value="g">Grams (g)</Option>
            <Option value="L">Liters (L)</Option>
            <Option value="mL">Milliliters (mL)</Option>
          </Select>
        </div>
        )}

<div>
          
          <Input
          label="Stock Quantity"
          type="number"
          color="blue"
          step={rawMaterial.unitType === 'bulk' ? 0.1 : 1}
          value={rawMaterial.stock}
          onChange={(e) => setRawMaterial({ ...rawMaterial, stock: e.target.value })}
        />
        
        </div>

        {/* Manufacturer */}
        <div>
        
          <Input
          label="Manufacturer"
            type="text"
            value={rawMaterial.manufacturer}
            onChange={(e) => handleInputChange("manufacturer", e.target.value)}
           color="blue"
            required
          />
        </div>

        {/* Price */}
        <div>
       
          <Input
          label="Price"
          color="blue"
            type="number"
            value={rawMaterial.price}
            onChange={(e) => handleInputChange("price", Number(e.target.value))}
            
            required
          />
        </div>

        

        {/* Description */}
        <div className="sm:col-span-2">
          <Textarea
          label="Description"
          color="blue"
            value={rawMaterial.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows="3"
           
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="filled"
          color="green"
        >
          Add Raw Material
        </Button>
      </div>
    </form>
  );
}