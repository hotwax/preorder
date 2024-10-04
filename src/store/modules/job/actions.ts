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
  async fetchCategoryJobs ({ commit }) {
    let resp, jobs = {} as any
    const requests = []
    const systemJobEnumIds = JSON.parse(process.env.VUE_APP_CTGRY_JOB)

    try {
      let params = {
        "inputFields": {
          "statusId": "SERVICE_DRAFT",
          "statusId_op": "equals",
          'systemJobEnumId': systemJobEnumIds,
          'systemJobEnumId_op': 'in'
        },
        "noConditionFind": "Y",
        "viewSize": systemJobEnumIds.length,
      } as any

      requests.push(JobService.fetchJobInformation(params).catch((error: any) => error))

      params = {
        "inputFields": {
          "statusId": "SERVICE_PENDING",
          "statusId_op": "equals",
          "productStoreId": this.state.user.currentEComStore?.productStoreId,
          'systemJobEnumId': systemJobEnumIds,
          'systemJobEnumId_op': 'in'
        },
        "noConditionFind": "Y",
        "orderBy": "runTime DESC",
        "viewSize": 15
      } as any
      
      requests.push(JobService.fetchJobInformation(params).catch((error: any) => error))

      const promiseResult = await Promise.allSettled(requests)
      // promise.allSettled returns an array of result with status and value fields
      resp = promiseResult.map((respone: any) => respone.value)
      let draft = {}, pending = {}

      if (!hasError(resp[0])) {
        draft = resp[0].data.docs.reduce((jobs: any, job: any) => {
          delete job.runTime
          jobs[job.systemJobEnumId] = job
          return jobs
        }, {})
      }

      if (!hasError(resp[1])) {
        pending = resp[1].data.docs.reduce((jobs: any, job: any) => {
          // keeping the job with the highest runTime
          if (!jobs[job.systemJobEnumId]) {
            jobs[job.systemJobEnumId] = job
          }
          return jobs
        }, {})
      } else {
        // if there are no pending jobs, we can skip the rest 
        // of the logic and return draft jobs only
        jobs = draft
        return
      }

      jobs = {...draft, ...pending}
      const pendingSysJobEnumIds = Object.keys(pending)

      await Promise.allSettled(pendingSysJobEnumIds.map(async (systemJobEnumId: string) => {
        const resp = await JobService.fetchJobInformation({
          "inputFields": {
            "productStoreId": this.state.user.currentEComStore?.productStoreId,
            'systemJobEnumId': systemJobEnumId,
            'systemJobEnumId_op': 'equals',
            "statusId": ["SERVICE_CANCELLED", "SERVICE_CRASHED", "SERVICE_FAILED", "SERVICE_FINISHED"],
            "statusId_op": "in",
          },
          // fetching statusId as well as only one field cannot be sent
          "fieldList": ["runTime", "systemJobEnumId"],
          "noConditionFind": "Y",
          "viewSize": 1,
          "orderBy": "runTime DESC"
        })

        if (!hasError(resp)) {
          const respJob = resp.data.docs[0]
          jobs[systemJobEnumId].lastRunTime = respJob.runTime
          return Promise.resolve(resp);
        } else {
          return Promise.reject(resp);
        }
      }))
    } catch (error) {
      console.error(error)
    } finally {
      commit(types.JOB_CATEGORY_JOBS_UPDATED, jobs)
    }
    return jobs;
  },

  async fetchBrokeringJob ({ commit }) {
    let resp = {} as any, jobId;
    let jobInfo = {} as any;

    try {
      resp = await JobService.fetchBrokeringJobId({
        "inputFields": {
          "settingTypeEnumId": "JOB_BKR_ORD",
          "productStoreId": this.state.user.currentEComStore?.productStoreId,
        },
        "fieldList": ["settingTypeEnumId", "settingValue", "fromDate", "productStoreId"],
        "entityName": "ProductStoreSetting",
        "viewSize": 1,
        "noConditionFind": "Y"
      })

      if(!hasError(resp)) {
        jobId = resp.data.docs?.length ? resp.data.docs[0]?.settingValue : ""
        
        if(jobId) {
          resp = await JobService.fetchBrokeringJobSchedule(jobId)

          if(!hasError(resp) && resp.data?.schedule) {
            jobInfo = resp.data.schedule
            resp = await JobService.fetchBrokeringJobActiveRun(jobInfo.jobName)
  
            if(!hasError(resp)) {
              jobInfo["lastRunTime"] = resp.data.lastRunTime
              jobInfo["routingGroupId"] = jobId
            } else {
              throw resp.data;
            }
          } else {
            throw resp.data;
          }
        }
      }
    } catch(error: any) {
      console.error(error);
    }

    commit(types.JOB_BROKERING_JOB_UPDATED, jobInfo)
  },

  clearCategoryJobs({commit}) {
    commit(types.JOB_CATEGORY_JOBS_UPDATED, { jobs: [] })
  }
}
export default actions;