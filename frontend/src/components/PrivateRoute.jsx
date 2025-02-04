import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout from "./Layout";
import PropTypes from "prop-types";

const PrivateRoute = ({ children, requireAdmin }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect cashiers to transactions page if they try to access admin-only routes
  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/transactions" />;
  }

  return <Layout>{children}</Layout>;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireAdmin: PropTypes.bool,
};
