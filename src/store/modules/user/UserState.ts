export default interface UserState {
    token: string;
    current: object | null;
    permissions: any;
    pwaState: any;
    instanceUrl: string;
    virtualFacilities: object | null;
    currentOrderParking: Array<string>;
}