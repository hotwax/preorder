export default interface UserState {
    token: string;
    current: object | null;
    selectedBrand: string;
    instanceUrl: string;
    tokenExpirationTime: number;
}