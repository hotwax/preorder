import { StockService } from '@/services/StockService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import StockState from './StockState'
import * as types from './mutation-types'
import { hasError } from '@/utils'
import { fetchProductsStockAtFacility, Response, Stock } from '@/adapter'

const actions: ActionTree<StockState, RootState> = {

  /**
   * Add stocks of specific product
   */
  // TODO: remove this action as not used
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

    try {
      const resp: Array<Stock> | Response = await fetchProductsStockAtFacility(productIds);
      commit(types.STOCK_ADD_PRODUCTS, resp)
    } catch(err: Response) {
      console.error(err.message)
    }
  }

}
export default actions;