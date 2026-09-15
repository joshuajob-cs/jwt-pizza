/**
 * @fileoverview The app shell and routing hub: holds the logged-in user and declares every page in one
 * `navItems` list that drives the routes, the header links, and the footer links.
 */
import React from 'react';
import { useEffect } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import Header from './header';
import Footer from './footer';
import Home from '../views/home';
import About from '../views/about';
import Register from '../views/register';
import Login from '../views/login';
import Logout from '../views/logout';
import Menu from '../views/menu';
import Delivery from '../views/delivery';
import FranchiseDashboard from '../views/franchiseDashboard';
import History from '../views/history';
import AdminDashboard from '../views/adminDashboard';
import DinerDashboard from '../views/dinerDashboard';
import CreateStore from '../views/createStore';
import CreateFranchise from '../views/createFranchise';
import CloseFranchise from '../views/closeFranchise';
import CloseStore from '../views/closeStore';
import Payment from '../views/payment';
import NotFound from '../views/notFound';
import Docs from '../views/docs';
import Breadcrumb from '../components/breadcrumb';
import { pizzaService } from '../service/service';
import { Role, User } from '../service/pizzaService';
import 'preline/preline';

declare global {
  interface Window {
    HSStaticMethods: any;
  }
}

/**
 * Top-level component: header, breadcrumb, the current page, and footer.
 *
 * `user` state lives here and nowhere else. It is passed down as a prop to pages that need it, and
 * `setUser` is passed to Login, Register, and Logout so they can change it. There is no global store.
 */
export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const location = useLocation();

  // On first load, restore the user from a token saved in localStorage (calls GET /api/user/me).
  useEffect(() => {
    (async () => {
      const user = await pizzaService.getUser();
      setUser(user);
    })();
  }, []);

  // After every page change, re-activate Preline's widgets (dropdowns, modals) and scroll to the top.
  useEffect(() => {
    window.HSStaticMethods.autoInit();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Constraint checks used by navItems to decide which links to show.
  function loggedIn() {
    return !!user;
  }
  function loggedOut() {
    return !loggedIn();
  }
  function isAdmin() {
    return Role.isRole(user, Role.Admin);
  }
  function isNotAdmin() {
    return !isAdmin();
  }

  /**
   * Every page in the app. Each entry has:
   * - `title`: link text (and the React key)
   * - `to`: the URL pattern for `<Route path>`. `:subPath?` is an optional first segment, so Login works at
   *   `/login` and also at `/payment/login`; going "back up" then returns to `/payment`
   * - `component`: the page to render
   * - `display`: where a link appears, `'nav'` (header) and/or `'footer'`; `[]` means no link
   * - `constraints`: functions that must all return true for the link to show
   *
   * NOTE: constraints only hide links. Every route is always registered, so typing a URL reaches any page;
   * pages like AdminDashboard check the role themselves, and the backend does the real enforcement.
   */
  const navItems = [
    { title: 'Home', to: '/', component: <Home />, display: [] },
    { title: 'Diner', to: '/diner-dashboard', component: <DinerDashboard user={user} />, display: [] },
    { title: 'Order', to: '/menu', component: <Menu />, display: ['nav'] },
    {
      title: 'Franchise',
      to: '/franchise-dashboard',
      component: <FranchiseDashboard user={user} />,
      constraints: [isNotAdmin],
      display: ['nav', 'footer'],
    },
    { title: 'About', to: '/about', component: <About />, display: ['footer'] },
    { title: 'History', to: '/history', component: <History />, display: ['footer'] },
    { title: 'Admin', to: '/admin-dashboard', component: <AdminDashboard user={user} />, constraints: [isAdmin], display: ['nav'] },
    { title: 'Create franchise', to: '/:subPath?/create-franchise', component: <CreateFranchise />, display: [] },
    { title: 'Close franchise', to: '/:subPath?/close-franchise', component: <CloseFranchise />, display: [] },
    { title: 'Create store', to: '/:subPath?/create-store', component: <CreateStore />, display: [] },
    { title: 'Close store', to: '/:subPath?/close-store', component: <CloseStore />, display: [] },
    { title: 'Payment', to: '/payment', component: <Payment />, display: [] },
    { title: 'Delivery', to: '/delivery', component: <Delivery />, display: [] },
    { title: 'Login', to: '/:subPath?/login', component: <Login setUser={setUser} />, constraints: [loggedOut], display: ['nav'] },
    { title: 'Register', to: '/:subPath?/register', component: <Register setUser={setUser} />, constraints: [loggedOut], display: ['nav'] },
    { title: 'Logout', to: '/:subPath?/logout', component: <Logout setUser={setUser} />, constraints: [loggedIn], display: ['nav'] },
    { title: 'Docs', to: '/docs/:docType?', component: <Docs />, display: [] },
    { title: 'Opps', to: '*', component: <NotFound />, display: [] },
  ];

  return (
    <div className="bg-gray-800">
      <Header user={user} navItems={navItems} />
      <Breadcrumb location={location.pathname.replace('/', '')} />

      <main className="size-full">
        <Routes>
          {navItems.map((item) => (
            <Route key={item.title} path={item.to} element={item.component} />
          ))}
        </Routes>
      </main>

      <Footer navItems={navItems} />
    </div>
  );
}
