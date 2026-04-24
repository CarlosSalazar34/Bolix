export const authService = {
    setToken: (token: string) => {
        localStorage.setItem('token', token);
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    logout: () => {
        localStorage.removeItem('token');
        // Quitamos window.location.href para que no recargue la página violentamente
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};