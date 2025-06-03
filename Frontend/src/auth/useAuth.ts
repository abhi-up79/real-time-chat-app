import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export const useAuth = () => {
    const {
        isAuthenticated,
        isLoading,
        user,
        loginWithRedirect,
        logout,
        getAccessTokenSilently,
    } = useAuth0();

    const login = () => loginWithRedirect();

    const logoutUser = () => {
        logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
    };

    const getToken = useCallback(async () => {
        try {
            return await getAccessTokenSilently();
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    }, [getAccessTokenSilently]);

    return {
        isAuthenticated,
        isLoading,
        user,
        login,
        logout: logoutUser,
        getToken,
    };
}; 