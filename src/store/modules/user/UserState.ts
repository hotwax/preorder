export default interface UserState {
    token: string;
    current: object | null;
    permissions: any;
    pwaState: any;
    instanceUrl: string;
    currentEComStore: object;
    virtualFacilities: object | null;
    currentOrderParking: Array<string>;
    omsRedirectionUrl: string;
    isMoquiOnly: boolean;
    productIdentificationPref: {
        primaryId: string;
        secondaryId: string;
    };
    productStoreFacilities: any;
    productIdentificationOptions: Array<any>;
}