import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '../../RootState'

const getters: GetterTree <UtilState, RootState> = {
  getFeature: (state) => (featureId: string) => {
    // Returning empty object so that it doesn't breaks the UI
    return (state.cachedFeatures as any)[featureId] ? (state.cachedFeatures as any)[featureId] : {};
  },
}
export default getters;