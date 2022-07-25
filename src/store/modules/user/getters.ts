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
    getUserProfile (state) {
        return state.current
    },
    getSelectedBrand (state) {
        return state.selectedBrand
    },
    getInstanceUrl (state) {
        return state.instanceUrl;
    },
    isTokenExpired(state, getters) {
        const currentTime = new Date().getTime();
        const tokenExpirationTime = getters.getTokenExpirationTime;
        return tokenExpirationTime <= currentTime ? !!state.tokenExpirationTime : !state.tokenExpirationTime
    },
    getTokenExpirationTime(state) {
        return state.tokenExpirationTime
    }
}
export default getters;