import { GetterTree } from 'vuex'
import OrderState from './OrderState'
import RootState from '../../RootState'

const getters: GetterTree <OrderState, RootState> = {
    getList (state) {
        return state.list.items
    },
    getListTotal (state) {
        return state.list.total
    },
    getListPreorders (state) {
        return state.list.preorderCount
    },
    getBrokeringCountByProduct: (state) => (productId: string) => {
        const brokeringCount = state.brokeringCountByProduct[productId];
        return brokeringCount ? brokeringCount : 0;
    },
    getQuery (state) {
        return state.query
    },
    isScrolleable(state) {
        return state.list.items.length > 0 && state.list.items.length < state.list.total
    },
    getSelectedItems (state) {
        return state.selectedItems;
    },
    getSelectedItemsCount (state) {
        return state.selectedItems.length;
    },
    getSelectedItemsToRelease: (state) => (toFacilityId: string, changeReasonEnumId: string) => {
        return state.selectedItems.map((item) => {
            return {
                orderId: item.orderId,
                orderItemSeqId: item.orderItemSeqId,
                toFacilityId,
                changeReasonEnumId
              }
        });
    },
    getSelectedItemsToUpdatePromiseDate: (state) => (promisedDatetime: any) => {
        return state.selectedItems.map((item) => {
            return {
                orderId: item.orderId,
                orderItemSeqId: item.orderItemSeqId,
                promisedDatetime
              }
        });
    },
    getSelectedItemsToCancel (state) {
        return state.selectedItems.map((item) => {
            return {
                orderId: item.orderId,
                orderItemSeqId: item.orderItemSeqId
              }
        });
    }
}
export default getters;