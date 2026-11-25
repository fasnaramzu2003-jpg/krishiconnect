
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'

const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))
const Assistant = lazy(() => import('./pages/Assistant.jsx'))
const Community = lazy(() => import('./pages/Community.jsx'))
const CropHealth = lazy(() => import('./pages/CropHealth.jsx'))
const Crops = lazy(() => import('./pages/Crops.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Farms = lazy(() => import('./pages/Farms.jsx'))
const GroupSales = lazy(() => import('./pages/GroupSales.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const ListingDetail = lazy(() => import('./pages/ListingDetail.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Market = lazy(() => import('./pages/Market.jsx'))
const Marketplace = lazy(() => import('./pages/Marketplace.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Notification = lazy(() => import('./pages/Notification.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const QuestionDetail = lazy(() => import('./pages/QuestionDetail.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const SellProduce = lazy(() => import('./pages/SellProduce.jsx'))

export default function App() {
  return (
    <Suspense fallback={<p role="status">Loading...</p>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ListingDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<QuestionDetail />} />
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
            <Route path="/notifications" element={<Notification />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
