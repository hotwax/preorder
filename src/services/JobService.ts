import { api } from '@/adapter';
import store from '@/store'

const fetchJobs = async (payload: any): Promise <any>  => {
    return api({
            url: "dataManagerLogs", 
            method: "post",
            data: payload
          });
}
const prepareFetchJobsQuery = () => {
  return {
    "filters":{
      "configId": ["MDM_REL_ORD_ITM_JSON", "MDM_CAN_ORD_ITM_JSON", "MDM_UPD_ORD_ITM_JSON"],
      "configId_op": "in",
      "statusId": [ 'SERVICE_PENDING', 'SERVICE_RUNNING', 'SERVICE_QUEUED'],
      "statusId_op": "in",
    },
    "fieldsToSelect": ["jobId", "createdDate", "scriptTitle", "description"],
    "sortBy" : "createdDate ASC",
    "sortOrder" : "createdDate ASC" // TODO Remove it
  }
}
const pollJobs = async (): Promise <any>  => {
  const lastPoll = setTimeout(function() {
    store.dispatch("job/fetchPolledJobs", prepareFetchJobsQuery())
  }, process.env.VUE_APP_POLL_TIME);
  window.onbeforeunload = function(){
    clearTimeout(lastPoll);
  }
}

export const JobService = {
    fetchJobs,
    pollJobs,
    prepareFetchJobsQuery
}