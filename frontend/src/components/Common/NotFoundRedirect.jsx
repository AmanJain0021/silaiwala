import { Navigate, useLocation } from 'react-router-dom';

/** Avoid sending logged-in app users to the marketing landing page on unknown routes */
const NotFoundRedirect = () => {
    const { pathname } = useLocation();

    if (pathname.startsWith('/user')) {
        return <Navigate to="/user" replace />;
    }
    if (pathname.startsWith('/admin')) {
        return <Navigate to="/admin/login" replace />;
    }
    if (pathname.startsWith('/partner')) {
        return <Navigate to="/partner/login" replace />;
    }
    if (pathname.startsWith('/delivery')) {
        return <Navigate to="/delivery/login" replace />;
    }
    if (pathname.startsWith('/executive')) {
        return <Navigate to="/executive/login" replace />;
    }

    return <Navigate to="/" replace />;
};

export default NotFoundRedirect;
