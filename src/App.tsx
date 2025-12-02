import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login, SignUp, ForgotPassword, OtpEntry, ResetPassword } from "./Auth";
import { Splash, Home,UserDetailModal, RequestHistoryPage,Tabs,TransactionHistoryPage ,ClientMessaging,DueDiligence, Services, Lostland,Profile,Support,AdminRequest,Consultancy,AdminConfiguration,AdminManagement } from './pages';
import ConsultancyList from './pages/ConsultancyList';
import { DefaultLayout } from "./components";
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute'; // For protecting main routes
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated'; // New component to prevent auth pages access when logged in

import AdminConsultancyPage from "./pages/AdminConsultancy";
function App() {
  const [loading, setLoading] = useState(true);

  
  // Simulate loading for splash screen (e.g., 1 second)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Conditionally render the splash screen or the actual app
  if (loading) {
    return <Splash />;
  }

  return (
    <div className="min-h-[100vh]">
      <BrowserRouter>
        <Toaster />
        <Routes>
          {/* Public Routes with RedirectIfAuthenticated */}
          <Route
            path="/signup"
            element={
              <RedirectIfAuthenticated>
                <SignUp />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/otp" element={<OtpEntry />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Home />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <RequestHistoryPage />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
             <Route
            path="/customerMessage"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <ClientMessaging />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
            <Route
            path="/tabs"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Tabs />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
             <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <TransactionHistoryPage />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/due-diligence"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <DueDiligence />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Services />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
           <Route
            path="/adminConfig"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <AdminConfiguration />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminManagement"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <AdminManagement />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
            <Route
            path="/consultancy"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Consultancy />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultancy-list"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <ConsultancyList />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lost-lands"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Lostland />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
            <Route
            path="/users"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <UserDetailModal />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Profile />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <Support />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />


        {/* admin Section */}

          <Route
            path="/adminRequest"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <AdminRequest />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />

<Route
            path="/adminConsultancy"
            element={
              <ProtectedRoute>
                <DefaultLayout>
                  <AdminConsultancyPage />
                </DefaultLayout>
              </ProtectedRoute>
            }
          />


          
        </Routes>

      </BrowserRouter>
    </div>
  );
}

export default App;
