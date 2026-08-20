import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  SocketProvider,
} from './context/SocketContext';

import {
  useAuth,
} from './context/AuthContext';

import ProtectedRoute
  from './components/ProtectedRoute';


// ============================================================
// AUTH
// ============================================================

import Login
  from './pages/Login';

import Register
  from './pages/Register';

import OrganizerRegister
  from './pages/OrganizerRegister';


// ============================================================
// CUSTOMER
// ============================================================

import Dashboard
  from './pages/customer/Dashboard';

import EventList
  from './pages/customer/EventList';

import SeatMap
  from './pages/customer/SeatMap';

import BookingHistory
  from './pages/customer/BookingHistory';

import WaitlistOffer
  from './pages/customer/WaitlistOffer';


// ============================================================
// ADMIN
// ============================================================

import AdminDashboard
  from './pages/admin/AdminDashboard';

import OrganizerApprovals
  from './pages/admin/OrganizerApprovals';

import VenueManager
  from './pages/admin/VenueManager';


// ============================================================
// ORGANISER
// ============================================================

import EventManager
  from './pages/organiser/EventManager';


// ============================================================
// OTHER
// ============================================================

import Analytics
  from './pages/Analytics';

import Settings
  from './pages/Settings';


// ============================================================
// HOME
// ============================================================

function Home() {

  const {
    user,
    loading,
  } = useAuth();


  if (loading) {
    return null;
  }


  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  if (
    user.role ===
    'ADMIN'
  ) {

    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );

  }


  if (
    user.role ===
    'ORGANISER'
  ) {

    return (
      <Navigate
        to="/organiser/events"
        replace
      />
    );

  }


  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );

}


// ============================================================
// APP
// ============================================================

export default function App() {

  return (

    <SocketProvider>

      <Routes>


        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* AUTH */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/organizer-register"
          element={<OrganizerRegister />}
        />


        {/* CUSTOMER */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              roles={['CUSTOMER']}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        <Route
          path="/events"
          element={
            <ProtectedRoute
              roles={['CUSTOMER']}
            >
              <EventList />
            </ProtectedRoute>
          }
        />


        <Route
          path="/events/:id/seats"
          element={
            <ProtectedRoute
              roles={['CUSTOMER']}
            >
              <SeatMap />
            </ProtectedRoute>
          }
        />


        <Route
          path="/bookings"
          element={
            <ProtectedRoute
              roles={['CUSTOMER']}
            >
              <BookingHistory />
            </ProtectedRoute>
          }
        />


        <Route
          path="/waitlist-offer/:token"
          element={
            <ProtectedRoute
              roles={['CUSTOMER']}
            >
              <WaitlistOffer />
            </ProtectedRoute>
          }
        />


        {/* ADMIN */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              roles={['ADMIN']}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/organizers"
          element={
            <ProtectedRoute
              roles={['ADMIN']}
            >
              <OrganizerApprovals />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/venues"
          element={
            <ProtectedRoute
              roles={['ADMIN']}
            >
              <VenueManager />
            </ProtectedRoute>
          }
        />


        {/* ANALYTICS */}

        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              roles={[
                'ADMIN',
                'ORGANISER',
              ]}
            >
              <Analytics />
            </ProtectedRoute>
          }
        />


        {/* ORGANISER */}

        <Route
          path="/organiser/events"
          element={
            <ProtectedRoute
              roles={['ORGANISER']}
            >
              <EventManager />
            </ProtectedRoute>
          }
        />


        {/* SETTINGS */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />


        {/* FALLBACK */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </SocketProvider>

  );

}