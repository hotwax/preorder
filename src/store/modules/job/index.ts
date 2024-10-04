import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import JobState from './JobState'
import RootState from '../../RootState'

const jobModule: Module<JobState, RootState> = {
    namespaced: true,
    state: {    
      list: {
        items: [],
        total: 0
      },
      logs: {
        items: [],
        total: 0
      },
      polling: false,
      ctgryAndBrkrngJobs: {},
      brokeringJob: {}
    },
    getters,
    actions,
    mutations,
}

export default jobModule;

// TODO
// store.registerModule('job', jobModule);
