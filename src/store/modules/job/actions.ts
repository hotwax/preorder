import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import JobState from './JobState'
import * as types from './mutation-types'
import { hasError } from '@/utils'
import { JobService } from '@/services/JobService'

const actions: ActionTree<JobState, RootState> = {

  async fetchJobs ( { commit }, payload) {
    const resp = await JobService.fetchJobs(payload)
    if (resp.status === 200 && !hasError(resp)) {
      commit(types.JOB_LIST_UPDATED, {
        items: resp.data.docs ? resp.data.docs : [], // TODO Handled error & docs undefined when no record
        total: resp.data.count ? resp.data.count : 0 , //  TODO Handled error & count undefined when no record
       });
    }
    // Removed Toast as it will also be async job
    // TODO Handle specific error
    return resp;
  },
  async fetchPolledJobs ( { commit }, payload) {
    const resp = await JobService.fetchJobs(payload);
    if (resp.status === 200 && !hasError(resp)) {
      if(resp.data.count) {
        JobService.pollJobs();
        commit(types.JOB_UPDATED, {
          items: resp.data.docs,
          total: resp.data.count,
          polling: true
         });
      } else {
        commit(types.JOB_UPDATED, {
          items: resp.data.docs ? resp.data.docs : [], // TODO Handled error & docs undefined when no record
          total: resp.data.count ? resp.data.count : 0 , //  TODO Handled error & count undefined when no record
          polling: false
         });
      }
    }
    // TODO Handle specific error
    return resp;
  },
  async initiatePollingJobs ( { commit, state, dispatch }) {
    if (!state.polling) {
      const resp = await dispatch("fetchJobs", JobService.prepareFetchJobsQuery());
      if(resp.data.count) {
        commit(types.JOB_POLLING_UPDATED, { 
          polling: true
        });
        JobService.pollJobs();
      } else {
        commit(types.JOB_POLLING_UPDATED, { 
          polling: false
        });
      }
      // TODO Handle specific error
      return resp;
    }
  },

}
export default actions;