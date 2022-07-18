import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import "moment-timezone";
import { Product } from '@hotwax/oms-api/src/types';
import { findProductFeatureTypeDetails } from '@hotwax/oms-api/src/product';
import * as types from './mutation-types'

const actions: ActionTree<UtilState, RootState> = {
  async findProductFeatureTypeDetails({ commit, state }, payload) {
    const productFeatureIds = Object.keys(state.cachedFeatures as any);
    const featureIds = [] as Array<string>;
    payload.map((product: Product) => {
      product.features?.map((feature: any) => {
        const featureId = feature.productFeatureId;
        if (!productFeatureIds.includes(featureId) && !featureIds.includes(featureId)) featureIds.push(featureId)
      })
    })

    try {
      const resp = await findProductFeatureTypeDetails(featureIds);
      if (resp.code !== 'error') {
        commit(types.UTIL_CACHED_FEATURE_BULK_UPDATED, resp)
      } else {
        throw resp;
      }
    } catch (err) {
      console.error(err)
    }
  }
}
export default actions;