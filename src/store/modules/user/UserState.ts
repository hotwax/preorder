export default interface UserState {
    token: string;
    current: object | null;
    permissions: any;
    pwaState: any;
    instanceUrl: string;
    currentEComStore: object;
    omsRedirectionInfo: {
      url: string;
      token: string;
    }
}