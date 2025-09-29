// src/pages/ManageBOMsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Select,
  Option,
  Button,
  Input,
  IconButton,
  Alert,
  Spinner,
} from '@material-tailwind/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../api'; // Your API instance

const ManageBOMsPage = ({ authContext }) => {
  const [readyProducts, setReadyProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bomIngredients, setBomIngredients] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all ready products and raw materials when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all products to filter 'ready' ones
        const allProductsRes = await api.get(`/get/${authContext.user._id}`);
        const ready = allProductsRes.data.filter(p => p.type === 'ready');
        setReadyProducts(ready);

        // Fetch raw materials for ingredient selection
        const rawMaterialsRes = await api.get(`/get-raw-materials/${authContext.user._id}`);
        setRawMaterials(rawMaterialsRes.data);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setError('Failed to load products or raw materials.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [authContext.user._id]);

  // Fetch BOM for selected product
  const fetchBOM = useCallback(async () => {
    if (!selectedProductId) {
      setBomIngredients([]);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get(`/bom/get/${selectedProductId}`);
      // Map BOM ingredients to match our state structure for editing
      setBomIngredients(res.data.bom.map(item => ({
        material: item.material._id, // Only store ID for selection
        materialName: item.material.name, // Display name
        quantity: item.quantity,
        waste: item.waste,
      })));
    } catch (err) {
      console.error('Failed to fetch BOM:', err);
      setError('Failed to load Bill of Materials.');
      setBomIngredients([]); // Clear if BOM not found or error
    } finally {
      setLoading(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    fetchBOM();
  }, [selectedProductId, fetchBOM]);

  const handleProductSelect = (value) => {
    setSelectedProductId(value);
  };

  const addIngredientRow = () => {
    setBomIngredients([...bomIngredients, { material: '', quantity: 0, waste: 0 }]);
  };

  const removeIngredientRow = (index) => {
    const newIngredients = [...bomIngredients];
    newIngredients.splice(index, 1);
    setBomIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...bomIngredients];
    newIngredients[index][field] = value;
    setBomIngredients(newIngredients);
  };

  const saveBOM = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!selectedProductId) {
        throw new Error('Please select a finished product.');
      }
      const payload = {
        productId: selectedProductId,
        ingredients: bomIngredients.map(item => ({
          material: item.material,
          quantity: Number(item.quantity),
          waste: Number(item.waste),
        })),
      };

      // Basic validation: ensure all fields are filled
      for (const item of payload.ingredients) {
        if (!item.material || isNaN(item.quantity) || item.quantity < 0 || isNaN(item.waste) || item.waste < 0) {
          throw new Error('Please ensure all ingredient fields are valid (material selected, quantity/waste are non-negative numbers).');
        }
      }

      await api.post('/bom/set', payload);
      setSuccess('Bill of Materials updated successfully!');
      fetchBOM(); // Refresh BOM after saving
    } catch (err) {
      console.error('Failed to save BOM:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save Bill of Materials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-6">Manage Bill of Materials (BOMs)</Typography>

      <Card className="mb-6">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-4">Select Finished Product</Typography>
          <Select
            label="Select a Ready Product"
            selected={selectedProductId}
            onChange={handleProductSelect}
            disabled={loading}
          >
            {readyProducts.map((product) => (
              <Option key={product._id} value={product._id}>
                {product.name} ({product.manufacturer})
              </Option>
            ))}
          </Select>
        </CardBody>
      </Card>

      {error && (
        <Alert color="red" className="mb-4">
          <Typography>{error}</Typography>
        </Alert>
      )}
      {success && (
        <Alert color="green" className="mb-4">
          <Typography>{success}</Typography>
        </Alert>
      )}

      {selectedProductId && (
        <Card>
          <CardBody>
            <Typography variant="h6" color="blue-gray" className="mb-4">
              BOM for {readyProducts.find(p => p._id === selectedProductId)?.name}
            </Typography>

            {loading && <div className="flex justify-center"><Spinner className="h-8 w-8" /></div>}

            {!loading && bomIngredients.length === 0 && (
              <Typography className="mb-4">
                No BOM defined yet for this product. Add ingredients below.
              </Typography>
            )}

            {!loading && bomIngredients.map((ingredient, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                <div className="w-full md:w-2/5">
                  <Select
                    label="Raw Material"
                    value={ingredient.material}
                    onChange={(val) => handleIngredientChange(index, 'material', val)}
                    disabled={loading}
                  >
                    {rawMaterials.map((raw) => (
                      <Option key={raw._id} value={raw._id}>
                        {raw.name} ({raw.size} {raw.unitType})
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="w-full md:w-1/4">
                  <Input
                    label="Quantity per Unit"
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    min="0"
                    disabled={loading}
                  />
                </div>
                <div className="w-full md:w-1/4">
                  <Input
                    label="Waste per Unit"
                    type="number"
                    value={ingredient.waste}
                    onChange={(e) => handleIngredientChange(index, 'waste', e.target.value)}
                    min="0"
                    disabled={loading}
                  />
                </div>
                <IconButton
                  color="red"
                  size="sm"
                  onClick={() => removeIngredientRow(index)}
                  disabled={loading}
                >
                  <XMarkIcon className="h-5 w-5" />
                </IconButton>
              </div>
            ))}

            <Button
              variant="outlined"
              color="blue-gray"
              onClick={addIngredientRow}
              className="mt-4 mr-2"
              disabled={loading}
            >
              <PlusIcon className="h-4 w-4 inline-block mr-1" /> Add Ingredient
            </Button>
            <Button
              color="green"
              onClick={saveBOM}
              className="mt-4"
              disabled={loading || bomIngredients.length === 0 || !selectedProductId}
            >
              {loading ? <Spinner className="h-4 w-4 inline-block mr-2" /> : null} Save BOM
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ManageBOMsPage;