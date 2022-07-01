import { toastController } from '@ionic/vue';

// TODO Use separate files for specific utilities

// TODO Remove it when HC APIs are fully REST compliant
const hasError = (response: any) => {
    return !!response.data._ERROR_MESSAGE_ || !!response.data._ERROR_MESSAGE_LIST_;
}

const showToast = async (message: string) => {
    const toast = await toastController
        .create({
          message,
          duration: 3000,
          position: 'bottom',
        })
      return toast.present();
}

const getFeatures = (featureList: any, featureKey: string) => {
  let  featuresValue = ''
  if (featureList) {
    featureList.filter((featureItem: any) => {
      if (featureItem.feature.productFeatureTypeEnumId === featureKey) {
        featuresValue += `${featuresValue ? ', ' : ''}` + featureItem.feature.description
      }
    })
  }
  // trim removes extra white space from beginning for the first feature
  return featuresValue.trim();
}

const getFeaturesList = (featureHierarchy: any, featureKey: string) => {
  const featuresList = [] as Array<string>
  if (featureHierarchy) {
    featureHierarchy.filter((featureItem: any) => {
      if (featureItem.feature.productFeatureTypeEnumId === featureKey) {
        featuresList.push(featureItem.feature.description)
      }
    })
  }
  return featuresList;
}

const getFeature = (featureHierarchy: any, featureKey: string) => {
  if (featureHierarchy) {
    return featureHierarchy.find((featureItem: any) => featureItem.feature.productFeatureTypeEnumId === featureKey)?.feature.description
  }
}

export { showToast, hasError, getFeature, getFeatures, getFeaturesList }