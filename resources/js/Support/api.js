import axios from 'axios';

export const api = {
    cart: {
        count: () => axios.get('/api/cart/count'),
        index: () => axios.get('/api/cart'),
        add: (data) => axios.post('/api/cart/add', data),
        update: (itemId, quantity) => axios.put(`/api/cart/${itemId}`, { quantity }),
        remove: (itemId) => axios.delete(`/api/cart/${itemId}`),
        clear: () => axios.delete('/api/cart'),
    },
    favorites: {
        toggle: (productId) => axios.post('/api/favorites/toggle', { product_id: productId }),
        count: () => axios.get('/api/favorites/count'),
        index: (perPage = 15) => axios.get('/api/favorites', { params: { per_page: perPage } }),
        check: (productId) => axios.get('/api/favorites/check', { params: { product_id: productId } }),
    },
    personalization: {
        trackView: (productId) => axios.post('/api/personalization/track/view', { product_id: productId }),
        recentlyViewed: (limit = 10) => axios.get('/api/personalization/recently-viewed', { params: { limit } }),
        recommendations: (productId, limit = 8) => axios.get(`/api/personalization/recommendations/${productId}`, { params: { limit } }),
        personalized: (limit = 12) => axios.get('/api/personalization/personalized', { params: { limit } }),
    },
};

export default api;
