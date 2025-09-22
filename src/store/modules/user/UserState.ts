export default interface UserState {
    token: string;
    current: object | null;
    permissions: any;
    pwaState: any;
    instanceUrl: string;
    currentProductStore: object;
    virtualFacilities: object | null;
    currentOrderParking: Array<string>;
}