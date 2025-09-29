
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Spinner,
  Alert,
  List,
  ListItem,
  ListItemPrefix,
} from '@material-tailwind/react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../api'; // Your API instance

const ProductionOrderDetails = () => {
  const { id } = useParams(); // Get the production order ID from the URL
  const [productionOrder, setProductionOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // --- UPDATED API CALL ---
        const res = await api.get(`/production-orders/details/${id}`); 
        setProductionOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch production order details:', err);
        setError(err.response?.data?.message || 'Failed to load production order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center py-8">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert color="red" className="mb-4">
          <Typography>{error}</Typography>
          <Link to="/dashboard/production-details" className="text-sm font-bold mt-2 inline-block">
            <ArrowLeftIcon className="h-4 w-4 inline-block mr-1" /> Back to Production Orders
          </Link>
        </Alert>
      </div>
    );
  }

  if (!productionOrder) {
    return (
      <div className="p-4">
        <Alert color="orange" className="mb-4">
          <Typography>Production order not found.</Typography>
          <Link to="/dashboard/production-details" className="text-sm font-bold mt-2 inline-block">
            <ArrowLeftIcon className="h-4 w-4 inline-block mr-1" /> Back to Production Orders
          </Link>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Link to="/dashboard/production-details" className="text-blue-500 hover:underline flex items-center mb-4">
        <ArrowLeftIcon className="h-4 w-4 inline-block mr-2" /> Back to Production Orders
      </Link>
      <Typography variant="h4" className="mb-6">Production Order Details</Typography>

      <Card className="mb-6">
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-4">Order Summary</Typography>
          <List>
            <ListItem className="py-1">
              <ListItemPrefix className="font-bold w-32">Order ID:</ListItemPrefix>
              <Typography className="font-normal">{productionOrder._id}</Typography>
            </ListItem>
            <ListItem className="py-1">
              <ListItemPrefix className="font-bold w-32">Date:</ListItemPrefix>
              <Typography className="font-normal">
                {new Date(productionOrder.productionDate).toLocaleString()}
              </Typography>
            </ListItem>
            <ListItem className="py-1">
              <ListItemPrefix className="font-bold w-32">Finished Product:</ListItemPrefix>
              <Typography className="font-normal">
                {productionOrder.finishedProduct?.name} ({productionOrder.finishedProduct?.manufacturer})
              </Typography>
            </ListItem>
            <ListItem className="py-1">
              <ListItemPrefix className="font-bold w-32">Quantity Produced:</ListItemPrefix>
              <Typography className="font-normal">{productionOrder.quantityProduced}</Typography>
            </ListItem>
            <ListItem className="py-1">
              <ListItemPrefix className="font-bold w-32">Notes:</ListItemPrefix>
              <Typography className="font-normal">{productionOrder.notes || '-'}</Typography>
            </ListItem>
          </List>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-4">Materials Consumed (BOM Snapshot)</Typography>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] table-auto">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Material Name</th>
                  <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Ideal Qty/Unit</th>
                  <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Ideal Waste/Unit</th>
                  <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Actual Total Consumed</th>
                  <th className="border-b border-blue-gray-50 py-3 px-2 text-left">Actual Waste</th>
                </tr>
              </thead>
              <tbody>
                {productionOrder.bomSnapshot.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-2 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray">
                        {item.materialName || item.material?.name || 'N/A'}
                      </Typography>
                    </td>
                    <td className="py-2 px-2 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray">
                        {item.idealQuantityPerUnit} {item.materialSize || item.material?.size || ''}
                      </Typography>
                    </td>
                    <td className="py-2 px-2 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray">
                        {item.idealWastePerUnit} {item.materialSize || item.material?.size || ''}
                      </Typography>
                    </td>
                    <td className="py-2 px-2 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray">
                        {item.actualQuantityConsumed} {item.materialSize || item.material?.size || ''}
                      </Typography>
                    </td>
                    <td className="py-2 px-2 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray">
                        {item.actualWaste} {item.materialSize || item.material?.size || ''}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProductionOrderDetails;