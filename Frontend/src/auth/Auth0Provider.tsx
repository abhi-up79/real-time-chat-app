import { Auth0Provider as BaseAuth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { auth0Config } from './auth0-config';

interface Auth0ProviderProps {
    children: ReactNode;
}

export const Auth0Provider = ({ children }: Auth0ProviderProps) => {
    const onRedirectCallback = (appState: any) => {
        window.history.replaceState(
            {},
            document.title,
            appState?.returnTo || window.location.pathname
        );
    };

    return (
        <BaseAuth0Provider
            domain={auth0Config.domain}
            clientId={auth0Config.clientId}
            authorizationParams={auth0Config.authorizationParams}
            useRefreshTokens={true}
            cacheLocation="localstorage"
            onRedirectCallback={onRedirectCallback}
        >
            {children}
        </BaseAuth0Provider>
    );
}; 