// src/pages/CreateProductionOrderForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Select,
  Option,
  Button,
  Input,
  Textarea,
  Alert,
  Spinner,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Your API instance

const ProductionOrderForm = ({ authContext }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Step 1 State
  const [readyProducts, setReadyProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityToProduce, setQuantityToProduce] = useState(1);
  const [notes, setNotes] = useState('');

  // Step 2 State
  const [currentFinishedProduct, setCurrentFinishedProduct] = useState(null); // Full product object
  const [rawMaterialsMap, setRawMaterialsMap] = useState({}); // Map for quick lookup
  const [bomDetails, setBomDetails] = useState([]); // [{ materialId, idealQtyPerUnit, idealWastePerUnit, availableStock, actualWasteInput, totalConsumed }]
  const [hasInsufficientStock, setHasInsufficientStock] = useState(false);

  // Fetch initial data (ready products)
  useEffect(() => {
    const fetchReadyProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/get/${authContext.user._id}`);
        setReadyProducts(res.data.filter(p => p.type === 'ready'));
      } catch (err) {
        console.error('Failed to fetch ready products:', err);
        setError('Failed to load available finished products.');
      } finally {
        setLoading(false);
      }
    };
   if (authContext.user) fetchReadyProducts();
  }, [authContext.user]);

  // Handle 'Next Step' from Step 1
  const handleNextStep1 = async () => {
    if (!selectedProductId || quantityToProduce <= 0) {
      setError('Please select a finished product and enter a valid quantity.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Fetch the selected finished product with its BOM populated
      const productRes = await api.get(`/get/${authContext.user._id}`); // Re-fetch all or get specific if /get/:id exists
      const fullProduct = productRes.data.find(p => p._id === selectedProductId);
console.log('Selected Finished Product:', fullProduct);
      if (!fullProduct) {
        throw new Error('Selected finished product details not found.');
      }
      if (fullProduct.type !== 'ready') {
        throw new Error('Only "ready" products can be produced.');
      }
      if (!fullProduct.ingredients || fullProduct.ingredients.length === 0) {
        throw new Error('Selected product does not have a Bill of Materials (BOM) defined. Please define it first.');
      }

      setCurrentFinishedProduct(fullProduct);

      // Fetch all raw materials to get their current stock
      const rawMaterialsRes = await api.get(`/get-raw-materials/${authContext.user._id}`);
      console.log('Fetched Raw Materials:', rawMaterialsRes.data);
      const rawMap = rawMaterialsRes.data.reduce((acc, rm) => {
        acc[rm._id] = rm;
        return acc;
      }, {});
      setRawMaterialsMap(rawMap);

      const initialBomDetails = fullProduct.ingredients.map(ing => {
        // Defensive: handle both string and object forms
        const materialId = typeof ing.material === 'string' ? ing.material : ing.material._id;
        // Debug logging
        console.log('BOM ingredient:', ing.material);
        console.log('rawMaterialsMap keys:', Object.keys(rawMap));
        console.log('Looking up materialId:', materialId);
        const rawMaterialData = rawMap[materialId];
        console.log('Raw material lookup result:', rawMaterialData);
        return {
          materialId,
          materialName: rawMaterialData?.name || ing.material.name || materialId || 'Unknown',
          materialUnitType: rawMaterialData?.unitType || ing.material.unitType || 'units',
          materialSize: rawMaterialData?.size || ing.material.size || '',
          idealQuantityPerUnit: ing.quantity,
          idealWastePerUnit: ing.waste,
          availableStock: rawMaterialData?.stock || 0,
          actualWasteInput: ing.waste * quantityToProduce, // Initial manual waste is ideal total waste
        };
      });
      setBomDetails(initialBomDetails);
      setStep(2);
    } catch (err) {
      console.error('Error in step 1:', err);
      setError(err.response?.data?.message || err.message || 'Failed to prepare for production.');
    } finally {
      setLoading(false);
    }
  };


  // Calculate totals for Step 2
  const calculateTotals = useCallback((details) => {
    let insufficient = false;
    const updatedBomDetails = details.map(item => {
      const idealQty = parseFloat(item.idealQuantityPerUnit) * parseFloat(quantityToProduce);
      const actualWaste = parseFloat(item.actualWasteInput);
      const totalConsumed = idealQty + (isNaN(actualWaste) ? 0 : actualWaste);

      // Check for discrete items requiring whole numbers
      if (rawMaterialsMap[item.materialId]?.unitType === 'discrete' && !Number.isInteger(totalConsumed)) {
        item.error = `Discrete item needs whole numbers (${totalConsumed})`;
        insufficient = true; // Treat as insufficient for now
      } else if (totalConsumed > item.availableStock) {
        item.error = `Insufficient stock (Need ${totalConsumed}, Have ${item.availableStock})`;
        insufficient = true;
      } else {
        item.error = '';
      }
      return { ...item, totalConsumed };
    });
    setBomDetails(updatedBomDetails);
    setHasInsufficientStock(insufficient);
  }, [quantityToProduce, rawMaterialsMap]);

  useEffect(() => {
    if (step === 2 && currentFinishedProduct) {
      calculateTotals(bomDetails);
    }
    // eslint-disable-next-line
  }, [step, quantityToProduce, currentFinishedProduct]);

  // Recalculate totals when actualWasteInput changes
  const handleActualWasteChange = (index, value) => {
    const newBomDetails = [...bomDetails];
    newBomDetails[index].actualWasteInput = value;
    setBomDetails(newBomDetails);
    calculateTotals(newBomDetails);
  };



  const handleSubmitProductionOrder = async () => {
    setDialogOpen(true); // Open confirmation dialog
  };

  const confirmProduction = async () => {
    setDialogOpen(false); // Close dialog
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        userID: authContext.user._id,
        finishedProductId: selectedProductId,
        quantityProduced: Number(quantityToProduce),
        notes: notes,
        ingredientAdjustments: bomDetails.map(item => {
          // Always parse as float at this point
          const actualWaste = parseFloat(item.actualWasteInput);
          const idealWaste = parseFloat(item.idealWastePerUnit) * quantityToProduce;
          return {
            materialId: item.materialId,
           manualWaste: !isNaN(actualWaste) ? parseFloat(actualWaste.toFixed(4)) : 0
          };
        }),
      };

      await api.post('/production-orders/create', payload);
      setSuccess('Production order created successfully!');
      // Reset form or navigate
      setTimeout(() => {
        navigate('/dashboard/production-details'); // Go to list page
      }, 1500);
    } catch (err) {
      console.error('Failed to create production order:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create production order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-6">Create New Production Order</Typography>

      <div className="flex gap-4 mb-6">
        <Button variant={step === 1 ? "filled" : "outlined"} onClick={() => setStep(1)}>Step 1: Product & Quantity</Button>
        <Button variant={step === 2 ? "filled" : "outlined"} onClick={() => setStep(2)} disabled={!selectedProductId}>Step 2: Review Materials</Button>
      </div>

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

      {/* Step 1: Select Product & Quantity */}
      {step === 1 && (
        <Card>
          <CardBody>
            <Typography variant="h6" color="blue-gray" className="mb-4">Select Finished Product & Quantity</Typography>
            <div className="mb-4">
              <Select
                label="Select Finished Product (Type: Ready)"
                selected={selectedProductId}
                onChange={(val) => setSelectedProductId(val)}
                disabled={loading}
              >
                {readyProducts.map((product) => (
                  <Option key={product._id} value={product._id}>
                    {product.name} ({product.manufacturer}) - Stock: {product.stock}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="mb-4">
              <Input
                label="Quantity to Produce"
                type="number"
                value={quantityToProduce}
                onChange={(e) => setQuantityToProduce(Number(e.target.value))}
                min="1"
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <Textarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              color="blue"
              onClick={handleNextStep1}
              disabled={loading || !selectedProductId || quantityToProduce <= 0}
            >
              {loading ? <Spinner className="h-4 w-4 inline-block mr-2" /> : null} Next Step
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Review Raw Material Requirements & Adjust Wastage */}
      {step === 2 && currentFinishedProduct && (
        <Card>
          <CardBody>
            <Typography variant="h6" color="blue-gray" className="mb-4">
              Review Raw Materials for "{currentFinishedProduct.name}"
            </Typography>
            <Typography className="mb-4">
              Producing: <span className="font-bold">{quantityToProduce}</span> units of {currentFinishedProduct.name}
            </Typography>
            <Typography className="mb-4">
              Current Finished Product Stock: <span className="font-bold">{currentFinishedProduct.stock}</span> units
            </Typography>
            <Typography className="mb-4">
              Estimated New Stock: <span className="font-bold">{currentFinishedProduct.stock + Number(quantityToProduce)}</span> units
            </Typography>

            {bomDetails.length === 0 && (
              <Typography className="mb-4">No BOM defined for this product, cannot proceed.</Typography>
            )}

            {bomDetails.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full min-w-[900px] table-auto">
                  <thead>
                    <tr>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Material</th>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Ideal Qty/Unit</th>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Ideal Waste/Unit</th>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Required (Total, Ideal)</th>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Available Stock</th>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Actual Waste (Total)</th>
                      <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Total Consumed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomDetails.map((item, index) => (
                      <tr key={item.materialId} className={item.error ? "bg-red-50" : ""}>
                        <td className="py-2 px-2 border-b border-blue-gray-50">
                          <Typography variant="small" color="blue-gray">{item.materialName}</Typography>
                        </td>
                        <td className="py-2 px-2 border-b border-blue-gray-50">
                          <Typography variant="small" color="blue-gray">{item.idealQuantityPerUnit} {item.materialSize}</Typography>
                        </td>
                        <td className="py-2 px-2 border-b border-blue-gray-50">
                          <Typography variant="small" color="blue-gray">{item.idealWastePerUnit} {item.materialSize}</Typography>
                        </td>
                        <td className="py-2 px-2 border-b border-blue-gray-50">
                          <Typography variant="small" color="blue-gray">
                            {(item.idealQuantityPerUnit + item.idealWastePerUnit) * quantityToProduce} {item.materialSize}
                          </Typography>
                        </td>
                        <td className="py-2 px-2 border-b border-blue-gray-50">
                          <Typography variant="small" color="blue-gray">{item.availableStock.toFixed(2)} {item.materialSize}</Typography>
                        </td>
                        <td className="py-2 px-2 border-b border-blue-gray-50 w-32">
                          <Input
                            type="number"
                            value={item.actualWasteInput}
                            onChange={(e) => handleActualWasteChange(index, e.target.value)}
                            min="0"
                            disabled={loading}
                            error={!!item.error}
                            className="p-1"
                          />
                        </td>
                        <td className="py-2 px-2 border-b border-blue-gray-50">
                          <Typography variant="small" color="blue-gray" className={item.error ? "text-red-600 font-bold" : ""}>
                            {item.totalConsumed} {item.materialSize}
                          </Typography>
                          {item.error && (
                            <Typography variant="small" color="red" className="block text-xs">
                              {item.error}
                            </Typography>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button variant="outlined" color="blue-gray" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button
                color="green"
                onClick={handleSubmitProductionOrder}
                disabled={loading || hasInsufficientStock || bomDetails.length === 0}
              >
                {loading ? <Spinner className="h-4 w-4 inline-block mr-2" /> : null} Confirm Production
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Dialog open={dialogOpen} handler={setDialogOpen}>
        <DialogHeader>Confirm Production Order</DialogHeader>
        <DialogBody divider>
          Are you sure you want to create a production order for <span className="font-bold">{quantityToProduce}</span> units of{' '}
          <span className="font-bold">{currentFinishedProduct?.name}</span>?
          This will update inventory stocks.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setDialogOpen(false)}
            className="mr-1"
          >
            <span>Cancel</span>
          </Button>
          <Button variant="gradient" color="green" onClick={confirmProduction}>
            <span>Confirm</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ProductionOrderForm;