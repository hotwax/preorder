export default interface JobState {
    list: {
        total: number;
        items: any[];
    },
    logs: {
        total: number;
        items: any[];
    },
    polling: boolean,
    ctgryAndBrkrngJobs: any,
    brokeringJob: any
}