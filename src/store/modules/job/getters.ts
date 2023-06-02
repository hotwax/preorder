import { GetterTree } from 'vuex'
import JobState from './JobState'
import RootState from '../../RootState'

const getters: GetterTree <JobState, RootState> = {
    getList (state) {
        return state.list.items
    },
    getLogs (state) {
        return state.logs.items
    },
    getTotal(state) {
        return state.list.total + state.logs.total
    },
    isPolling(state) {
        return state.polling;
    },
    isJobPending(state) {
        return (state.list.total + state.logs.total) > 0;
    },
    getCtgryAndBrkrngJob: (state) => (systemJobEnumId: string) => {
        return state.ctgryAndBrkrngJobs[systemJobEnumId] ? state.ctgryAndBrkrngJobs[systemJobEnumId] : {};
    }
}
export default getters;