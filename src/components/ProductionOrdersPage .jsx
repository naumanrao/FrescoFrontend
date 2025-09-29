import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
  Alert,
  Avatar,
} from '@material-tailwind/react';
import { Link } from 'react-router-dom';
import api from '../api'; // Your API instance

const ProductionOrdersPage = ({ authContext }) => {
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProductionOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/production-orders/${authContext.user._id}`); // Hypothetical endpoint
        setProductionOrders(res.data); // Assuming res.data is an array of production orders
      } catch (err) {
        console.error('Failed to fetch production orders:', err);
        setError('Failed to load production orders.');
      } finally {
        setLoading(false);
      }
    };
    if (authContext.user) fetchProductionOrders();
  }, [authContext.user]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Production Orders</Typography>
        <Link to="/dashboard/production-order">
          <Button color="green">Create New Production Order</Button>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner className="h-12 w-12" />
        </div>
      )}

      {error && (
        <Alert color="red" className="mb-4">
          <Typography>{error}</Typography>
        </Alert>
      )}

      {!loading && productionOrders.length === 0 && !error && (
        <Card>
          <CardBody>
            <Typography>No production orders found. Start by creating one!</Typography>
          </CardBody>
        </Card>
      )}

      {!loading && productionOrders.length > 0 && (
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                        Date
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                        Finished Product
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                        Qty Produced
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                        Notes
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                        Actions
                      </Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productionOrders.map((order, index) => (
                    <tr key={order._id}>
                      <td className={`py-3 px-5 ${index === productionOrders.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {new Date(order.productionDate).toLocaleDateString()}
                        </Typography>
                      </td>
                      <td className={`py-3 px-5 ${index === productionOrders.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {order.finishedProduct?.name || 'N/A'} {/* Assuming finishedProduct is populated */}
                        </Typography>
                      </td>
                      <td className={`py-3 px-5 ${index === productionOrders.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {order.quantityProduced}
                        </Typography>
                      </td>
                      <td className={`py-3 px-5 ${index === productionOrders.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {order.notes || '-'}
                        </Typography>
                      </td>
                      <td className={`py-3 px-5 ${index === productionOrders.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Link to={`/dashboard/production-orders/details/${order._id}`}>
                          <Button variant="outlined" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ProductionOrdersPage;