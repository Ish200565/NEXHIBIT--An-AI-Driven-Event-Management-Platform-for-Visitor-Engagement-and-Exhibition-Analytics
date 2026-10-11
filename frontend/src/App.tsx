import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetails from './pages/EventDetails'
import Register from './pages/Register'
import VisitorRegister from './pages/VisitorRegister'
import Login from './pages/Login'
import CompanyDashboard from './pages/CompanyDashboard'
import OrganizerDashboard from './pages/OrganizerDashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/register" element={<Register />} />
        <Route path="/visitor-register" element={<VisitorRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<CompanyDashboard />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}