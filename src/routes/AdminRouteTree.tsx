import { Routes } from "react-router-dom";
import { adminRoutes } from "@/routes/adminRoutes";

export default function AdminRouteTree() {
  return <Routes>{adminRoutes}</Routes>;
}
