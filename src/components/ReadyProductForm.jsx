import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { BASE_URL } from "../config";
import {
  Button,
  Select,
  Option,
  Input,
  Textarea 
} from "@material-tailwind/react";
export default function ReadyProductForm({ authContext, onSuccess }) {
  const [product, setProduct] = useState({
    name: "",
    manufacturer: "",
    description: "",
    stock: 0,
    size:"units",
    price: 0,
    ingredients: [],
  });
  const [rawMaterials, setRawMaterials] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/product/get-raw-materials/${authContext.user._id}`
        );
        if (!response.ok) throw new Error('Failed to fetch materials');
        const data = await response.json();
        setRawMaterials(data);
      } catch (error) {
        console.error('Error:', error);
        alert(`Error loading materials: ${error.message}`);
      }
    };

    if (authContext.user) fetchMaterials();
  }, [authContext.user]);

  const handleInputChange = (key, value) => {
    setProduct(prev => ({ 
      ...prev, 
      [key]: typeof value === 'number' ? (isNaN(value) ? 0 : value) : value 
    }));
  };

    const removeIngredient = (index) => {
    setProduct((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };
  const handleIngredientChange = (index, field, value) => {
    setProduct(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => {
        if (i === index) {
          // For Select, just store the value directly
          if (field === "material") {
            return { ...ingredient, [field]: value };
          }
          // For numeric fields, parse to number
          return { ...ingredient, [field]: value === "" ? 0 : Number(value) };
        }
        return ingredient;
      })
    }));
  };

  const addIngredient = () => {
    setProduct(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        material: "", 
        quantity: 0, 
        waste: 0 
      }]
    }));
  };

  const validateIngredients = () => {
    for (const ingredient of product.ingredients) {
      const material = rawMaterials.find(m => m._id === ingredient.material);
      
      if (!material) return { valid: false, error: "Please select a valid material" };
      if (isNaN(ingredient.quantity) || ingredient.quantity <= 0) 
        return { valid: false, error: "Invalid quantity value" };
      if (isNaN(ingredient.waste) || ingredient.waste < 0) 
        return { valid: false, error: "Invalid waste value" };
    }
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateIngredients();
    if (!validation.valid) return alert(validation.error);

    try {
  const response = await fetch(`${BASE_URL}/api/product/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authContext.token}`
        },
        body: JSON.stringify({
          ...product,
          type: "ready",
          userID: authContext.user
        }),
      });

      // Handle non-JSON responses
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) throw new Error(data.error || "Server error");

      alert("Product added successfully!");
      onSuccess();
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid gap-4 mb-4 sm:grid-cols-2">
        {/* Product fields... */}
   {/* Product Name */}
   <div>
          <Input
          label="Product Name"
          color="blue"
            type="text"
            value={product.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>

        {/* Manufacturer */}
        <div>

          <Input
          label="Manufacturer"
          color="blue"
            type="text"
            value={product.manufacturer}
            onChange={(e) => handleInputChange("manufacturer", e.target.value)}
            required
          />
        </div>

        {/* Price */}
        <div>
          <Input
          label="Price"
          color="blue"
            type="number"
            value={product.price}
            onChange={(e) => handleInputChange("price", Number(e.target.value))}
            required
          />
        </div>

        {/* Stock */}
        <div>
          <Input
          label="Stock"
          color="blue"
            type="number"
            value={product.stock}
            onChange={(e) => handleInputChange("stock", Number(e.target.value))}
            required
          />
        </div>
       
        {/* Ingredients Section */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingredients
          </label>
          {product.ingredients.map((ingredient, index) => {
            const selectedMaterial = rawMaterials.find(m => m._id === ingredient.material);
            const unitType = selectedMaterial?.unitType || 'discrete';
            const unitSymbol = selectedMaterial?.size || 'units';

            return (
              <div key={index} className="flex gap-2 mb-2 items-center">
                <div>
                <Select
                  color="blue"
                   selected={(element) =>
    rawMaterials.find((m) => m._id === ingredient.material)?.name || "Select Raw Material"
  }
                  onChange={(val) => handleIngredientChange(index, "material", val)}
                  required
                >
                  {rawMaterials.map(material => (
                    <Option key={material._id} value={material._id}>
                      {material.name} ({material.unitType === 'bulk' ? material.size : 'units'})
                    </Option>
                  ))}
                </Select>
        </div>
                {/* Quantity Input */}
                <div>
                <Input
                  label={`Quantity (${unitSymbol}/unit)`}
                  color="blue"
                  type="number"
                  step={unitType === 'bulk' ? 0.1 : 1}
                  min="0"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                  required
                />
        </div>
                {/* Waste Input */}
                <div >

                <Input
                  label={`Waste (${unitSymbol}/unit)`}
                  color="blue"
                  type="number"
                  step={unitType === 'bulk' ? 0.1 : 1}
                  min="0"
                  value={ingredient.waste}
                  onChange={(e) => handleIngredientChange(index, "waste", e.target.value)}
                  required
                />
        </div>
        <div  className="mt-2">
                <Button
                  variant="filled"
                  color="red"
                  type="button"
                  onClick={() => removeIngredient(index)}
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
                </div>
              </div>
            );
          })}
          
          <Button
          color="blue"
            type="button"
            onClick={addIngredient}
            className="flex items-center mt-2"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Ingredient
          </Button>
        </div>

        {/* Description field... */}
      </div>

      <Button
     
      color="lime"
        type="submit"
        className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none"
      >
        Add Ready Product
      </Button>
    </form>
  );
}