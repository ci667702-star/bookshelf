import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/ui/States.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout, { ProtectedRoute } from './layouts/AuthLayout.jsx';
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const MyShelvesPage = lazy(() => import('./pages/MyShelvesPage.jsx'));
const ShelfDetailPage = lazy(() => import('./pages/ShelfDetailPage.jsx'));
const BookNewPage = lazy(() => import('./pages/BookNewPage.jsx'));
const BookEditPage = lazy(() => import('./pages/BookEditPage.jsx'));
const BookDetailPage = lazy(() => import('./pages/BookDetailPage.jsx'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage.jsx'));
const ReviewDetailPage = lazy(() => import('./pages/ReviewDetailPage.jsx'));
const ReviewWritePage = lazy(() => import('./pages/ReviewWritePage.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const SharedShelvesPage = lazy(() => import('./pages/SharedShelvesPage.jsx'));
const SharedShelfDetailPage = lazy(() => import('./pages/SharedShelfDetailPage.jsx'));
const DecoratePage = lazy(() => import('./pages/DecoratePage.jsx'));
const MyPage = lazy(() => import('./pages/MyPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const MarathonPage = lazy(() => import('./pages/MarathonPage.jsx'));
const ExplorePage = lazy(() => import('./pages/ExplorePage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader label="페이지를 펼치는 중..." />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shelves" element={<MyShelvesPage />} />
        <Route path="/shelves/:id" element={<ShelfDetailPage />} />
        <Route path="/books/new" element={<BookNewPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/books/:id/edit" element={<BookEditPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/new" element={<ReviewWritePage />} />
        <Route path="/reviews/:id" element={<ReviewDetailPage />} />
        <Route path="/reviews/:id/edit" element={<ReviewWritePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/shared" element={<SharedShelvesPage />} />
        <Route path="/shared/:id" element={<SharedShelfDetailPage />} />
        <Route path="/decorate" element={<DecoratePage />} />
        <Route path="/decorate/:id" element={<DecoratePage />} />
        <Route path="/marathon" element={<MarathonPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/me" element={<MyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
