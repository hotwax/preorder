import { api } from '@/adapter';
import store from '@/store'
import { DateTime } from 'luxon';

const fetchJobLogs = async (payload: any): Promise <any>  => {
  return api({
          url: "dataManagerLogs", 
          method: "post",
          data: payload
        });
}

const fetchJobs = async (payload: any): Promise <any>  => {
    return api({
            url: "findJobs", 
            method: "post",
            data: payload
          });
}
const prepareFetchJobsQuery = () => {
  const lastActionTimestamp = (store.state as any).order.lastActionTimestamp;
  return {
    "inputFields": {
      "serviceName": "ftpExportProductThresholdCsv",
      "statusId": ['SERVICE_PENDING', 'SERVICE_RUNNING', 'SERVICE_QUEUED'],
      "statusId_op": "in",
      "runTime": DateTime.fromMillis(lastActionTimestamp).plus({ minutes: 10 }).valueOf(), // Fetch Jobs for next 10 mins from the last action
      "runTime_op": "lessThanEqualTo",
    },
    "fieldList": ["jobId", "runTime", "jobName"],
    "orderBy": "runTime ASC",
    "viewSize": 10
  }
}
const prepareFetchLogsQuery = () => {
  return {
    "filters": {
      "configId": ["MDM_REL_ORD_ITM_JSON", "MDM_CAN_ORD_ITM_JSON", "MDM_UPD_ORD_ITM_JSON"],
      "configId_op": "in",
      "statusId": ['SERVICE_PENDING', 'SERVICE_RUNNING', 'SERVICE_QUEUED'],
      "statusId_op": "in",
    },
    "fieldsToSelect": ["jobId", "createdDate", "scriptTitle", "description"],
    "sortBy": "createdDate ASC",
    "sortOrder": "createdDate ASC", // TODO Remove it
    "viewSize": "10"
  }
}
const pollJobs = async (): Promise <any>  => {
  const lastPoll = setTimeout(function() {
    store.dispatch("job/fetchPolledJobs", prepareFetchLogsQuery())
  }, process.env.VUE_APP_POLL_TIME);
  window.onbeforeunload = function(){
    clearTimeout(lastPoll);
  }
}

const fetchBackgroundJobs = async (): Promise <any>  => {
  const lastActionTimestamp = (store.state  as any).order.lastActionTimestamp;
  let jobResponse;
  // If we have lastActionTimestamp, release job ran and Job needs to be fetched
  if (lastActionTimestamp && DateTime.fromMillis(lastActionTimestamp).plus({ minutes: 10 }).diffNow('seconds').valueOf() > 0) {
    jobResponse = await store.dispatch("job/fetchJobs", prepareFetchJobsQuery())
  }
  const logResponse = await store.dispatch("job/fetchJobLogs", prepareFetchLogsQuery())
  return { jobResponse , logResponse }
}

export const JobService = {
    fetchBackgroundJobs,
    fetchJobLogs,
    fetchJobs,
    pollJobs,
    prepareFetchJobsQuery,
    prepareFetchLogsQuery
}