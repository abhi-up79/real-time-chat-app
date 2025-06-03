import { useAuth } from '../auth/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

export const Login = () => {
    const { isLoading, login } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md">
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Welcome to Chat App</h1>
                <button
                    onClick={() => login()}
                    className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Login with Auth0
                </button>
            </div>
        </div>
    );
}; 