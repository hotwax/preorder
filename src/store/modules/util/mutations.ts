import { MutationTree } from 'vuex'
import UtilState from './UtilState'
import * as types from './mutation-types'

const mutations: MutationTree <UtilState> = {
  [types.UTIL_CACHED_FEATURE_BULK_UPDATED] (state, payload) {
    if (payload) {
      payload.forEach((feature: any) => {
        (state.cachedFeatures as any)[feature.productFeatureId] = feature
      });
    }
  }
}
export default mutations;