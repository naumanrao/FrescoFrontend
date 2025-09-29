import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import { useEffect, useState } from "react";
import AuthContext from "@/AuthContext";

function PrivateRoute({ children }) {
  const user = localStorage.getItem("user");
  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }
  return children;
}

function App() {
    const [user, setUser] = useState("");
  const [loader, setLoader] = useState(true);
  let myLoginUser =localStorage.getItem("user");
  // console.log("USER: ",user)

    useEffect(() => {
     
      if (myLoginUser) {
        setUser(JSON.parse(myLoginUser));
      } else {
        setUser("");
      }
    }, []);

  const signin = (newUser, callback) => {
    setUser(newUser);
    callback();
  };
 let authValue = { user, signin };
  return (
    <AuthContext.Provider value={authValue}>
      <Routes>
        <Route path="/dashboard/*" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
