import { MutationTree } from 'vuex'
import JobState from './JobState'
import * as types from './mutation-types'

const mutations: MutationTree <JobState> = {
    [types.JOB_LIST_UPDATED] (state, payload) {
        state.list.items = payload.items
        state.list.total = payload.total
    },
    [types.JOB_POLLING_UPDATED] (state, payload) {
        state.polling = payload.polling
    },
    [types.JOB_UPDATED] (state, payload) {
        state.list.items = payload.items
        state.list.total = payload.total
        state.polling = payload.polling
    },
}
export default mutations;