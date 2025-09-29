import React, { useContext } from "react";
import AuthContext from "@/AuthContext";
import ProductionOrderForm from "../../components/ProductionOrderForm";

export default function ProductionOrderPage() {
  const authContext = useContext(AuthContext);
  return <ProductionOrderForm authContext={authContext} />;
}
