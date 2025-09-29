import React, { useContext } from "react";
import AuthContext from "@/AuthContext";
import ManageBOM from "../../components/ManageBOM";

export default function ManageBOMPage() {
  const authContext = useContext(AuthContext);
  return <ManageBOM authContext={authContext} />;
}
