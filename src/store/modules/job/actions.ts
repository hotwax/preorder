import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import JobState from './JobState'
import * as types from './mutation-types'
import { hasError } from '@/utils'
import { JobService } from '@/services/JobService'
import emitter from "@/event-bus"

const actions: ActionTree<JobState, RootState> = {

  async fetchJobs ( { commit }, payload) {
    const resp = await JobService.fetchJobs(payload)
    commit(types.JOB_LIST_UPDATED, {
      items: resp.data.docs ? resp.data.docs : [], // TODO Handled error & docs undefined when no record
      total: resp.data.count ? resp.data.count : 0 , //  TODO Handled error & count undefined when no record
      });
    // Removed Toast as it will also be async job
    // TODO Handle specific error
    return resp;
  },
  async fetchJobLogs ( { commit }, payload) {
    const resp = await JobService.fetchJobLogs(payload)
    commit(types.JOB_LOGS_UPDATED, {
      items: resp.data.docs ? resp.data.docs : [], // TODO Handled error & docs undefined when no record
      total: resp.data.count ? resp.data.count : 0 , //  TODO Handled error & count undefined when no record
      });
    // TODO Handle specific error
    return resp;
  },
  async fetchPolledJobs({ commit }) {
    const { jobResponse, logResponse } = await JobService.fetchBackgroundJobs();
    let backgroundJobCount = 0;
    if (jobResponse && jobResponse.status === 200 && !hasError(jobResponse)) {
      backgroundJobCount += jobResponse.data.count
    }
    if (logResponse && logResponse.status === 200 && !hasError(logResponse)) {
      backgroundJobCount += logResponse.data.count
    }
    // If we have any job or log in response then only go for polling
    if (backgroundJobCount) {
      commit(types.JOB_POLLING_UPDATED, {
        polling: true
      });
      JobService.pollJobs();
    } else {
      commit(types.JOB_POLLING_UPDATED, {
        polling: false
      });
      // Show user status that all background jobs are finished and product details page needs to be refreshed
      // TODO Try using polling in state to achieve the same
      emitter.emit("backgroundJobsFinished");
    }
    // TODO Handle specific error
    return { jobResponse, logResponse };
  },
  async initiatePollingJobs({ commit, state }) {
    if (!state.polling) {
      const { jobResponse, logResponse } = await JobService.fetchBackgroundJobs();
      let backgroundJobCount = 0;
      if (jobResponse && jobResponse.status === 200 && !hasError(jobResponse) && jobResponse.data.count) {
        backgroundJobCount += jobResponse.data.count
      }
      if (logResponse && logResponse.status === 200 && !hasError(logResponse) && logResponse.data.count) {
        backgroundJobCount += logResponse.data.count
      }

      // If we have any job or log in response then only go for polling
      if (backgroundJobCount) {
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
      return { jobResponse, logResponse };
    }
  },

}
export default actions;