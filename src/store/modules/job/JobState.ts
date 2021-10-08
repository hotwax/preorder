export default interface JobState {
    list: {
        total: number;
        items: any[];
    },
    polling: boolean
}