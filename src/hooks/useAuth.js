import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated, loading, actionLoading, error } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    isAuthenticated,
    loading,
    actionLoading,
    error,
  };
};

export default useAuth;
