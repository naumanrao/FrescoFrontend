import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications,Inventory } from "@/pages/dashboard";
import ManageBOMPage from "@/pages/dashboard/manage-bom.jsx";
import ProductionOrderPage from "@/pages/dashboard/production-order.jsx";
import ProductionDetailsPage from "@/pages/dashboard/production-details.jsx";
import { SignIn, SignUp } from "@/pages/auth";


const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "inventory",
        path: "/inventory",
        element: <Inventory />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "tables",
        path: "/tables",
        element: <Tables />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "notifications",
        path: "/notifications",
        element: <Notifications />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "manage bom",
        path: "/manage-bom",
        element: <ManageBOMPage />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "production order",
        path: "/production-order",
        element: <ProductionOrderPage />,
      },
       {
        icon: <TableCellsIcon {...icon} />,
        name: "production order details",
        path: "/production-details",
        element: <ProductionDetailsPage />,
      },
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
    ],
  },
];

export default routes;
