import React, { useContext } from "react";
import AuthContext from "@/AuthContext";
import ProductionOrdersPage from "@/components/ProductionOrdersPage ";

export default function ProductionDetailsPage() {
  const authContext = useContext(AuthContext);
  return <ProductionOrdersPage authContext={authContext} />;
}
