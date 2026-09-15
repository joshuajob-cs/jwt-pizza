/**
 * @fileoverview useBreadcrumb: a hook for "go up one level" navigation based on the current URL.
 */
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Returns a function that navigates to the parent of the current path, or to a sibling of it.
 *
 * Examples, from `/franchise-dashboard/create-store`:
 *   useBreadcrumb()           -> `/franchise-dashboard`
 * and from `/payment/login`:
 *   useBreadcrumb()           -> `/payment`
 *   useBreadcrumb('register') -> `/payment/register`
 *
 * It passes the current `location.state` along, which is how an in-progress order survives a detour
 * through login.
 *
 * @param sibling - name of a sibling path to go to instead of the parent
 */
function useBreadcrumb(sibling?: string) {
  const location = useLocation();
  const navigate = useNavigate();

  const navigateByBreadcrumb = () => {
    let newPath = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
    if (sibling) {
      newPath = newPath + '/' + sibling;
    } else if (newPath === '') {
      newPath = '/';
    }
    navigate(newPath, { state: location.state });
  };

  return navigateByBreadcrumb;
}

export { useBreadcrumb };
