
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import Crops from './pages/Crops.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Farms from './pages/Farms.jsx'
import GroupSales from './pages/GroupSales.jsx'
import Home from './pages/Home.jsx'
import Market from './pages/Market.jsx'
import CropHealth from './pages/CropHealth.jsx'
import Assistant from './pages/Assistant.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Login from './pages/Login.jsx'
import Marketplace from './pages/Marketplace.jsx'
import NotFound from './pages/NotFound.jsx'
import Orders from './pages/Orders.jsx'
import Register from './pages/Register.jsx'
import SellProduce from './pages/SellProduce.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ListingDetail />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/sell" element={<SellProduce />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/group-sales" element={<GroupSales />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/crop-health" element={<CropHealth />} />
          <Route path="/market" element={<Market />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
