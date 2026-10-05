import { GetterTree } from 'vuex'
import UserState from './UserState'
import RootState from '../../RootState'

const getters: GetterTree <UserState, RootState> = {
    isAuthenticated (state) {
        return !!state.token;
    },
    isUserAuthenticated(state) {
        return state.token && state.current
    },
    getUserToken (state) {
        return state.token
    },
    getUserPermissions (state) {
        return state.permissions;
    },
    getUserProfile (state) {
        return state.current
    },
    getInstanceUrl (state) {
        const baseUrl = process.env.VUE_APP_BASE_URL;
        return baseUrl ? baseUrl : state.instanceUrl;
    },
    getBaseUrl (state) {
        let baseURL = process.env.VUE_APP_BASE_URL;
        if (!baseURL) baseURL = state.instanceUrl;
        return baseURL.startsWith('http') ? baseURL.includes('/api') ? baseURL : `${baseURL}/api/` : `https://${baseURL}.hotwax.io/api/`;
    },
    getMaargBaseUrl(state) {
        let maargURL = state.instanceUrl
        if (maargURL) {
            maargURL = maargURL.startsWith('http') ? maargURL.includes('/rest/s1') ? maargURL : `${maargURL}/rest/s1/` : `https://${maargURL}.hotwax.io/rest/s1/`;
        }
        return maargURL
    },
    getPwaState(state) {
        return state.pwaState;
    },
    getCurrentEComStore(state) {
        return state.currentEComStore
    },
    getVirtualFacilities(state) {
        return state.virtualFacilities
    },
    getCurrentOrderParking(state) {
        return state.currentOrderParking
    },
    isMoquiOnly(state) {
        return state.isMoquiOnly
    },
    getProductIdentificationPref(state) {
        return state.productIdentificationPref
    },
    getProductIdentificationOptions(state) {
        return state.productIdentificationOptions
    },
    getProductStoreFacilities(state) {
        return state.productStoreFacilities
    }
}
export default getters;