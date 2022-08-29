import { StockService } from '@/services/StockService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import StockState from './StockState'
import * as types from './mutation-types'
import { hasError } from '@/utils'

const actions: ActionTree<StockState, RootState> = {

  /**
   * Add stocks of specific product
   */
  async addProduct  ( { commit }, { productId }) {
    const resp: any = await StockService.checkInventory({ productId });
    if (resp.status === 200) {
      commit(types.STOCK_ADD_PRODUCT, { productId, stock: resp.data.docs })
    }
  },

  /**
   * Add stocks of list of products
   */
   async addProducts  ( { commit }, { productIds }) {
    // There is a limitation at API level to handle only 100 records
    // but as we will always fetch data for the fetched records which will be as per the viewSize
    // assuming that the value will never be 100 to show
    const resp: any = await StockService.checkInventory({
      "viewSize": productIds.length,
      "filters": {
        "productId": productIds,
        "productId_op": "in",
      },
      "fieldsToSelect": ["productId","atp"], 
    });
    if (resp.status === 200 && !hasError(resp)) {
      // Handled empty response in case of failed query
      if (resp.data) commit(types.STOCK_ADD_PRODUCTS, { products: resp.data.docs })
    }
  }

}
export default actions;