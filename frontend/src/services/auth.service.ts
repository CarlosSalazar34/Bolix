export const authService = {
    setToken: (token: string) => {
        localStorage.setItem('bolix_token', token);
    },

    getToken: () => {
        return localStorage.getItem('bolix_token');
    },

    logout: () => {
        localStorage.removeItem('bolix_token');
        localStorage.removeItem('bolix_username');
        localStorage.removeItem('bolix_user_id');
        // Quitamos window.location.href para que no recargue la página violentamente
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('bolix_token');
    }
};