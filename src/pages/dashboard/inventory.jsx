import React, { useState, useEffect, useContext } from "react";
import AddProduct from "../../components/AddProduct.jsx";
import { UpdateProduct, BulkUpload } from "../../components";
import AuthContext from "@/AuthContext";
import { BASE_URL } from "@/config.js";
import IngredientsModal from "../../components/IngredientsModal.jsx";
import * as XLSX from "xlsx";

// Helper function to download Excel templates
function downloadTemplates() {
  // Raw Material Template
  const rawMaterialHeaders = [
    "Name",
    "Manufacturer",
    "Stock",
    "UnitType",
    "Size",
    "Description",
    "Price",
  ];
  const rawMaterialSheet = XLSX.utils.aoa_to_sheet([rawMaterialHeaders]);
  const rawMaterialWB = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(rawMaterialWB, rawMaterialSheet, "RawMaterialTemplate");
  XLSX.writeFile(rawMaterialWB, "RawMaterialTemplate.xlsx");

  // Ready Product Template
  const readyProductHeaders = [
    "Name",
    "Manufacturer",
    "Stock",
    "Price",
    "Size",
  ];
  const readyProductSheet = XLSX.utils.aoa_to_sheet([readyProductHeaders]);
  const readyProductWB = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(readyProductWB, readyProductSheet, "ReadyProductTemplate");
  XLSX.writeFile(readyProductWB, "ReadyProductTemplate.xlsx");
}
export function Inventory() {
  const [selectedInventoryType, setSelectedInventoryType] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateProduct, setUpdateProduct] = useState([]);
  const [products, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatePage, setUpdatePage] = useState(true);
  const [stores, setAllStores] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const authContext = useContext(AuthContext);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
const [selectedIngredients, setSelectedIngredients] = useState([]);

const openIngredientsModal = (ingredients) => {
  setSelectedIngredients(ingredients || []);
  setShowIngredientsModal(true);
};

  useEffect(() => {
    if (authContext.user && authContext.user._id) {
      fetchProductsData();
    }
    // fetchSalesData();
  }, [updatePage, authContext.user]);

  const fetchProductsData = () => {
    if (!authContext.user || !authContext.user._id) {
     
      return;
    }
    fetch(`${BASE_URL}/api/product/get/${authContext.user._id}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setAllProducts(data);
      })
      .catch((err) => console.log(err));
  };

  // Fetching Data of Search Products
  const fetchSearchData = () => {
    fetch(`${BASE_URL}/api/product/search?searchTerm=${searchTerm}`)
      .then((response) => response.json())
      .then((data) => {
        setAllProducts(data);
      })
      .catch((err) => console.log(err));
  };

  // Fetching all stores data
  // const fetchSalesData = () => {
  //   if (!authContext || !authContext.user) {
  //     console.error("authContext.user is undefined. Cannot fetch sales data.");
  //     return;
  //   }
  //   fetch(`${BASE_URL}/api/store/get/${authContext.user}`)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       setAllStores(data);
  //     })
  //     .catch((err) => console.log(err));
  // };

  // Modal for Product ADD
  const addProductModalSetting = () => {
    setShowProductModal(!showProductModal);
  };

  // Modal for Product UPDATE
  const updateProductModalSetting = (selectedProductData) => {
    setUpdateProduct(selectedProductData);
    setShowUpdateModal(!showUpdateModal);
  };

  // Delete item
  const deleteItem = (id) => {
    fetch(`${BASE_URL}/api/product/delete/${id}`)
      .then((response) => response.json())
      .then(() => {
        setUpdatePage(!updatePage);
      });
  };

  // Handle Page Update
  const handlePageUpdate = () => {
    setUpdatePage(!updatePage);
  };

  return (
    <div className="col-span-12 lg:col-span-10 min-h-screen pr-8">
      <div className="flex flex-col gap-6 w-full border-2 bg-white rounded-xl shadow-lg p-6 ">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white pb-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b">
          <div className="flex items-center gap-4">
            <span className="font-bold text-2xl text-blue-700">Inventory</span>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition"
              onClick={addProductModalSetting}
            >
              Add Product
            </button>
            <button className="bg-green-500 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow transition" onClick={() => setShowBulkModal(true)}>
              Bulk Upload
            </button>
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded shadow transition"
              onClick={downloadTemplates}
            >
              Download Template
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search products..."
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition" onClick={fetchSearchData}>
              Search
            </button>
          </div>
        </div>
        {showProductModal && <AddProduct handlePageUpdate={handlePageUpdate} addProductModalSetting={addProductModalSetting} />}
        {showUpdateModal && <UpdateProduct updateProductData={updateProduct} updateModalSetting={updateProductModalSetting} handlePageUpdate={handlePageUpdate} />}
        {showBulkModal && <BulkUpload closeModal={() => setShowBulkModal(false)} handlePageUpdate={handlePageUpdate} />}
        <IngredientsModal
          open={showIngredientsModal}
          handleOpen={() => setShowIngredientsModal(false)}
          ingredients={selectedIngredients}
        />

        {/* Counter Cards */}
        <div className="flex gap-6 mb-6">
          <div className="flex-1 bg-blue-50 rounded-xl shadow p-4 flex flex-col items-center">
            <span className="text-2xl font-bold text-blue-700">{products.length}</span>
            <span className="text-sm text-gray-600 mt-1">All Products</span>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-xl shadow p-4 flex flex-col items-center">
            <span className="text-2xl font-bold text-yellow-700">{products.filter(p => p.type === 'raw').length}</span>
            <span className="text-sm text-gray-600 mt-1">Raw Materials</span>
          </div>
          <div className="flex-1 bg-blue-100 rounded-xl shadow p-4 flex flex-col items-center">
            <span className="text-2xl font-bold text-blue-800">{products.filter(p => p.type === 'ready').length}</span>
            <span className="text-sm text-gray-600 mt-1">Ready Products</span>
          </div>
        </div>
        {/* Filter Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded font-semibold shadow transition text-sm ${selectedInventoryType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setSelectedInventoryType('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold shadow transition text-sm ${selectedInventoryType === 'ready' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setSelectedInventoryType('ready')}
          >
            Ready Products
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold shadow transition text-sm ${selectedInventoryType === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setSelectedInventoryType('raw')}
          >
            Raw Materials
          </button>
        </div>
        {/* Product Table */}
        <div className="overflow-x-auto rounded-lg border bg-white border-gray-200 mb-8">
          <table className="min-w-full divide-y-2 divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Name</th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Type</th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Manufacturer</th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Stock</th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Size</th>
                {/* <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Price</th> */}
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Description</th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12 text-lg">No products found.</td>
                </tr>
              ) : (
                products
                  .filter(product => selectedInventoryType === 'all' || product.type === selectedInventoryType)
                  .map(product => (
                    <tr key={product._id}>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-900">{product.name}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.type === 'raw' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{product.type === 'raw' ? 'Raw Material' : 'Ready Product'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">{product.manufacturer}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">{product.stock.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">{product.size}</td>
                      {/* <td className="whitespace-nowrap px-4 py-2 text-gray-700">${product.price}</td> */}
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">{product.description}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {/* {product.type === "ready" && (
  <button
    className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold shadow mr-2"
    onClick={() => openIngredientsModal(product.ingredients)}
  >
    View Ingredients
  </button>
)} */}
                        <button className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold shadow mr-2" onClick={() => updateProductModalSetting(product)}>Edit</button>
                        <button className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold shadow" onClick={() => deleteItem(product._id)}>Delete</button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


