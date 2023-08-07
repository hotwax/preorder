import { api } from '@/adapter';
import store from '@/store'
import { DateTime } from 'luxon';

const fetchJobLogs = async (payload: any): Promise<any> => {
  return api({
    url: "dataManagerLogs",
    method: "post",
    data: payload
  });
}

const fetchJobs = async (payload: any): Promise<any> => {
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
      "serviceName": "brokerReleasedOrderItems",
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
const pollJobs = async (): Promise<any> => {
  const lastPoll = setTimeout(function () {
    store.dispatch("job/fetchPolledJobs", prepareFetchLogsQuery())
  }, process.env.VUE_APP_POLL_TIME);
  window.onbeforeunload = function () {
    clearTimeout(lastPoll);
  }
}

const fetchBackgroundJobs = async (): Promise<any> => {
  const lastActionTimestamp = (store.state as any).order.lastActionTimestamp;
  let jobResponse;
  // If we have lastActionTimestamp, release job ran and Job needs to be fetched
  if (lastActionTimestamp && DateTime.fromMillis(lastActionTimestamp).plus({ minutes: 10 }).diffNow('seconds').valueOf() > 0) {
    jobResponse = await store.dispatch("job/fetchJobs", prepareFetchJobsQuery())
  }
  const logResponse = await store.dispatch("job/fetchJobLogs", prepareFetchLogsQuery())
  return { jobResponse, logResponse }
}

const fetchJobInformation = async (payload: any): Promise<any> => {
  return api({
    url: "/findJobs",
    method: "get",
    params: payload
  });
}

const cancelJob = async (jobId: any): Promise<any> => {
  return await api({
    url: "service/cancelScheduledJob",
    method: "post",
    data: { jobId }
  });
}

const runJobNow = async (job: any): Promise <any>  => {
  const payload = {
    'JOB_NAME': job.jobName,
    'SERVICE_NAME': job.serviceName,
    'SERVICE_COUNT': '0',
    'SERVICE_TEMP_EXPR': job.jobStatus,
    'jobFields': {
      'productStoreId': job.productStoreId,
      'systemJobEnumId': job.systemJobEnumId,
      'tempExprId': job.jobStatus, // Need to remove this as we are passing frequency in SERVICE_TEMP_EXPR, currently kept it for backward compatibility
      'parentJobId': job.parentJobId,
      'recurrenceTimeZone': store.state.user.current.userTimeZone,
    },
    'statusId': "SERVICE_PENDING",
    'systemJobEnumId': job.systemJobEnumId
  } as any

  // checking if the runtimeData has productStoreId, and if present then adding it on root level
  job?.runtimeData?.productStoreId?.length >= 0 && (payload['productStoreId'] = job.productStoreId)
  job?.priority && (payload['SERVICE_PRIORITY'] = job.priority.toString())
  job?.sinceId && (payload['sinceId'] = job.sinceId)

  // assigning '' (empty string) to all the runtimeData properties whose value is "null"
  job.runtimeData && Object.keys(job.runtimeData).map((key: any) => {
    if (job.runtimeData[key] === 'null') job.runtimeData[key] = ''
  })

  return await api({
    url: "scheduleService",
    method: "post",
    data: { ...job.runtimeData, ...payload }
  });
}

const scheduleJob = async (payload: any): Promise<any> => {
  const params = {
    'JOB_NAME': payload.job.jobName,
    'SERVICE_NAME': payload.job.serviceName,
    'SERVICE_COUNT': '0',
    'SERVICE_TEMP_EXPR': payload.frequency,
    'SERVICE_RUN_AS_SYSTEM': 'Y',
    'jobFields': {
      'productStoreId': store.state.user.currentEComStore.productStoreId,
      'systemJobEnumId': payload.job.systemJobEnumId,
      'tempExprId': payload.frequency, // Need to remove this as we are passing frequency in SERVICE_TEMP_EXPR, currently kept it for backward compatibility
      'maxRecurrenceCount': '-1',
      'parentJobId': payload.job.parentJobId,
      'runAsUser': 'system', //default system, but empty in run now.  TODO Need to remove this as we are using SERVICE_RUN_AS_SYSTEM, currently kept it for backward compatibility
      'recurrenceTimeZone': store.state.user.current.userTimeZone
    },
    'statusId': "SERVICE_PENDING",
    'systemJobEnumId': payload.job.systemJobEnumId
  } as any

  // checking if the runtimeData has productStoreId, and if present then adding it on root level
  payload.job?.runtimeData?.productStoreId?.length >= 0 && (params['productStoreId'] = store.state.user.currentEComStore.productStoreId)
  payload.job?.priority && (params['SERVICE_PRIORITY'] = payload.job.priority.toString())
  payload.runTime && (params['SERVICE_TIME'] = payload.runTime.toString())

  // assigning '' (empty string) to all the runtimeData properties whose value is "null"
  payload.job.runtimeData && Object.keys(payload.job.runtimeData).map((key: any) => {
    if (payload.job.runtimeData[key] === 'null') payload.job.runtimeData[key] = ''
  })

  return await api({
    url: "scheduleService",
    method: "post",
    data: { ...payload.job.runtimeData, ...params }
  });
}

export const JobService = {
  cancelJob,
  fetchBackgroundJobs,
  fetchJobLogs,
  fetchJobs,
  fetchJobInformation,
  pollJobs,
  prepareFetchJobsQuery,
  prepareFetchLogsQuery,
  scheduleJob,
  runJobNow
}
