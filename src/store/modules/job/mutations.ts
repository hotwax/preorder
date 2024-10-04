import { MutationTree } from 'vuex'
import JobState from './JobState'
import * as types from './mutation-types'

const mutations: MutationTree <JobState> = {
    [types.JOB_LIST_UPDATED] (state, payload) {
        state.list.items = payload.items
        state.list.total = payload.total
    },
    [types.JOB_LOGS_UPDATED] (state, payload) {
        state.logs.items = payload.items
        state.logs.total = payload.total
    },
    [types.JOB_POLLING_UPDATED] (state, payload) {
        state.polling = payload.polling
    },
    [types.JOB_UPDATED] (state, payload) {
        state.list.items = payload.items
        state.list.total = payload.total
        state.polling = payload.polling
    },
    [types.JOB_CTGRY_AND_BRKRNG_UPDATED] (state, payload) {
        state.ctgryAndBrkrngJobs = payload;
    },
    [types.JOB_BROKERING_JOB_UPDATED] (state, payload) {
        state.brokeringJob = payload;
    },
}
export default mutations;