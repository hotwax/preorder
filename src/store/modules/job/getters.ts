import { GetterTree } from 'vuex'
import JobState from './JobState'
import RootState from '../../RootState'

const getters: GetterTree <JobState, RootState> = {
    getList (state) {
        return state.list.items
    },
    getTotal(state) {
        return state.list.total
    },
    isPolling(state) {
        return state.polling;
    },
    isJobPending(state) {
        return state.list.total > 0;
    }
}
export default getters;