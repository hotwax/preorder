<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>{{ translate('Pre-order setup') }}</ion-title><ion-buttons slot="end"><ion-button :disabled="loading || !shopId" @click="load">{{ translate('Refresh') }}</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content>
      <ion-progress-bar v-if="loading" type="indeterminate" />
      <ion-list>
        <ion-item><ion-select v-model="shopId" :label="translate('Shopify shop')" interface="popover"><ion-select-option v-for="shop in shops" :key="shop.shopId" :value="shop.shopId">{{ shop.name || shop.shopId }}</ion-select-option></ion-select></ion-item>
        <ion-item v-if="!shops.length"><ion-label>{{ translate('No Shopify shop is connected to the selected store.') }}</ion-label></ion-item>
      </ion-list>
      <ErrorState v-if="error" :title="translate('Could not load setup')" :message="error" retryable @retry="load" />
      <template v-if="setup">
        <ion-card v-if="setup.errors?.length"><ion-card-header><ion-card-title>{{ translate('Some setup data is unavailable') }}</ion-card-title></ion-card-header><ion-card-content><p>{{ translate('Check backend deployment and account permissions before continuing.') }}</p><p v-for="path in setup.errors" :key="path">{{ path }}</p></ion-card-content></ion-card>
        <ion-card>
          <ion-card-header><ion-card-title>{{ translate('Pre-order inventory channel') }}</ion-card-title></ion-card-header>
          <ion-list>
            <ion-item><ion-label>{{ translate('Channel') }}</ion-label><ion-note slot="end">{{ channel?.inventoryChannelId || translate('Not configured') }}</ion-note></ion-item>
            <ion-item><ion-select v-model="facilityGroupId" :label="translate('Supply facility group')" interface="popover"><ion-select-option v-for="group in groups" :key="group.facilityGroupId" :value="group.facilityGroupId">{{ group.facilityGroupName || group.facilityGroupId }}</ion-select-option></ion-select></ion-item>
            <ion-item><ion-select v-model="shopifyLocationId" :label="translate('Shopify pre-order location')" interface="popover"><ion-select-option v-for="location in locationOptions" :key="location.shopifyLocationId" :value="location.shopifyLocationId">{{ location.facilityId ? `${seed.facilityName(location.facilityId)} (${location.shopifyLocationId})` : location.shopifyLocationId }}</ion-select-option></ion-select></ion-item>
            <ion-item v-for="member in members" :key="member.facilityId"><ion-label>{{ seed.facilityName(member.facilityId) }}<p>{{ member.facilityId }}</p></ion-label></ion-item>
            <ion-item v-if="facilityGroupId && !members.length"><ion-label>{{ translate('No active supply facilities in this group.') }}</ion-label></ion-item>
          </ion-list>
          <ion-button v-if="canConfigure" fill="clear" :disabled="loading || !facilityGroupId || !shopifyLocationId || setup.errors?.includes('sob/shopify/inventoryChannels')" @click="saveChannel">{{ translate('Save channel') }}</ion-button>
        </ion-card>
        <ion-card>
          <ion-card-header><ion-card-title>{{ translate('Store parking facilities') }}</ion-card-title></ion-card-header>
          <ion-list>
            <ion-item v-for="purpose in parkingPurposes" :key="purpose.id">
              <ion-select v-model="parkingSelections[purpose.id]" :label="translate(purpose.label)" interface="popover">
                <ion-select-option v-for="facility in parkingOptions(purpose.type)" :key="facility.facilityId" :value="facility.facilityId">{{ facility.facilityName || facility.facilityId }} ({{ facility.facilityId }})</ion-select-option>
              </ion-select>
              <ion-badge slot="end" :color="activePurposes.some((row: any) => row.facilityPurposeEnumId === purpose.id) ? 'success' : 'warning'">{{ activePurposes.some((row: any) => row.facilityPurposeEnumId === purpose.id) ? translate('Active') : translate('Not active') }}</ion-badge>
              <ion-button v-if="canConfigure" slot="end" fill="clear" :disabled="loading || !parkingSelections[purpose.id]" @click="confirmParking(purpose)">{{ translate('Activate') }}</ion-button>
            </ion-item>
          </ion-list>
        </ion-card>
        <ion-card>
          <ion-card-header><ion-card-title>{{ translate('Future inventory metafield') }}</ion-card-title><ion-card-subtitle>{{ translate('Shopify variant metafield, JSON') }}</ion-card-subtitle></ion-card-header>
          <ion-list><ion-item><ion-input v-model="namespace" :label="translate('Namespace')" label-placement="stacked" /></ion-item><ion-item><ion-input v-model="metafieldKey" :label="translate('Key')" label-placement="stacked" /></ion-item></ion-list>
          <ion-card-content>{{ translate('The effective default is hotwax.preorder_batches. The storefront must read the same namespace and key.') }}</ion-card-content>
          <ion-button v-if="canConfigure" fill="clear" :disabled="loading || !validMapping || setup.errors?.includes('sob/shopify/shopSetting')" @click="saveMapping">{{ translate('Save metafield mapping') }}</ion-button>
          <ion-button fill="clear" router-link="/sync-events">{{ translate('View sync events') }}</ion-button>
        </ion-card>
        <ion-card><ion-card-header><ion-card-title>{{ translate('Publishing jobs') }}</ion-card-title></ion-card-header><ion-list>
          <ion-item v-for="job in setup.jobs" :key="job.jobName"><ion-label class="ion-text-wrap">{{ job.jobName }}<p>{{ job.cronDescription }}</p><p v-if="job.scope">{{ job.scope }}</p><p v-if="job.latestRun">{{ translate('Last run') }}: {{ formatDateTime(job.latestRun.startTime) }} — {{ job.latestRun.hasError === 'Y' ? translate('Failed') : job.latestRun.endTime ? translate('Completed') : translate('Running') }}</p></ion-label><ion-badge slot="end" :color="job.available && job.paused === 'N' ? 'success' : 'warning'">{{ !job.available ? translate('Unavailable') : job.paused === 'Y' ? translate('Paused') : translate('Enabled') }}</ion-badge><ion-button v-if="canConfigure && job.available" slot="end" fill="clear" :disabled="loading" @click="changeJobState(job)">{{ job.paused === 'Y' ? translate('Enable') : translate('Pause') }}</ion-button><ion-button v-if="canConfigure && job.available" slot="end" fill="clear" :disabled="loading" @click="copySchedule(job)">{{ translate('Copy schedule') }}</ion-button></ion-item>
        </ion-list></ion-card>
        <ion-card><ion-card-header><ion-card-title>{{ translate('Event feeds') }}</ion-card-title></ion-card-header><ion-list><ion-item v-for="feed in setup.feeds" :key="feed.dataFeedId"><ion-label>{{ feed.dataFeedId }}</ion-label><ion-note slot="end">{{ feed.dataFeedTypeEnumId || translate('Unavailable') }}</ion-note></ion-item></ion-list></ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonProgressBar, IonList, IonItem, IonLabel, IonNote, IonSelect, IonSelectOption, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge, alertController, onIonViewWillEnter } from '@ionic/vue';
import { translate } from '@common';
import { useLiveEntity, useSeedData } from '@common/db';
import { preorderDb } from '@/db/preorderDb';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/user';
import { usePreorderSetup } from '@/composables/usePreorderSetup';
import Actions from '@/authorization/actions';
import ErrorState from '@/components/common/ErrorState.vue';
import { errorMessage } from '@/utils/response';
import { formatDateTime } from '@/utils/format';
import { showToast } from '@/utils';
const user = useUserStore(); const seed = useSeedData(); const actions = usePreorderSetup();
const productStore = useProductStore();
const storeId = computed(() => productStore.getCurrentProductStoreId);
const shopId = ref(''); const loading = ref(false); const error = ref('');
const namespace = ref('hotwax'); const metafieldKey = ref('preorder_batches'); const facilityGroupId = ref(''); const shopifyLocationId = ref('');
const parkingPurposes = [{ id: 'FP_PRE_ORDER_PARK', type: 'PRE_ORDER', label: 'Pre-order parking' }, { id: 'FP_BACKORDER_PARK', type: 'BACKORDER', label: 'Backorder parking' }];
const parkingSelections = ref<Record<string, string>>({});
const parkingOptions = (type: string) => seed.facilities.withSync().data.filter((row: any) => row.facilityTypeId === type);
const canConfigure = computed(() => user.hasPermission(Actions.APP_SETUP_UPDATE));
const { records: shops } = useLiveEntity<any>(preorderDb.tables.shopifyShops, () => ({ equals: { productStoreId: storeId.value } }));
const { first: setup } = useLiveEntity<any>(preorderDb.tables.preorderSetup, () => ({ equals: { shopId: shopId.value } }));
const { records: groups } = useLiveEntity<any>(preorderDb.tables.facilityGroups);
const { records: locations } = useLiveEntity<any>(preorderDb.tables.shopifyShopLocations, () => ({ equals: { shopId: shopId.value } }));
const { records: members } = useLiveEntity<any>(preorderDb.tables.groupFacilities, () => ({ equals: { facilityGroupId: facilityGroupId.value }, filter: (row: any) => (!row.fromDate || row.fromDate <= Date.now()) && (!row.thruDate || row.thruDate > Date.now()) }));
const channel = computed(() => setup.value?.channels?.find((row: any) => row.channelTypeEnumId === 'SICT_PRE_ORDER' && (!row.thruDate || row.thruDate > Date.now()) && (!row.fromDate || row.fromDate <= Date.now())));
const locationOptions = computed(() => {
  const rows = locations.value;
  const current = channel.value?.shopifyLocationId;
  return current && !rows.some(row => row.shopifyLocationId === current) ? [{ shopifyLocationId: current }, ...rows] : rows;
});
const activePurposes = computed(() => (setup.value?.purposes || []).filter((row: any) => ['FP_PRE_ORDER_PARK', 'FP_BACKORDER_PARK'].includes(row.facilityPurposeEnumId) && (!row.fromDate || row.fromDate <= Date.now()) && (!row.thruDate || row.thruDate > Date.now())));
const validMapping = computed(() => /^[\w-]+$/.test(namespace.value) && /^[\w-]+$/.test(metafieldKey.value));
watch(shops, rows => { if (!rows.some(row => row.shopId === shopId.value)) shopId.value = rows[0]?.shopId || ''; }, { immediate: true });
watch(shopId, () => { void load(); });
watch(setup, value => {
  for (const purpose of parkingPurposes) {
    parkingSelections.value[purpose.id] = activePurposes.value.find((row: any) => row.facilityPurposeEnumId === purpose.id)?.facilityId || value?.purposes?.find((row: any) => row.facilityPurposeEnumId === purpose.id && !row.thruDate)?.facilityId || '';
  }
  namespace.value = value?.settings?.find((row: any) => row.settingTypeEnumId === 'SHPFY_PRORD_MF_NS')?.settingValue || 'hotwax';
  metafieldKey.value = value?.settings?.find((row: any) => row.settingTypeEnumId === 'SHPFY_PRORD_MF_KEY')?.settingValue || 'preorder_batches';
  facilityGroupId.value = channel.value?.facilityGroupId || ''; shopifyLocationId.value = channel.value?.shopifyLocationId || '';
}, { immediate: true });
async function load() {
  if (!shopId.value || !storeId.value) return;
  loading.value = true; error.value = '';
  try { await actions.refresh(shopId.value, storeId.value); } catch (err) { error.value = errorMessage(err, translate('Could not load setup')); } finally { loading.value = false; }
}
async function saveMapping() {
  if (!canConfigure.value || !validMapping.value) return;
  loading.value = true; error.value = '';
  try { await actions.saveMetafield(shopId.value, storeId.value, namespace.value, metafieldKey.value); await showToast(translate('Metafield mapping saved.')); } catch (err) { error.value = errorMessage(err, translate('Failed to save the metafield mapping.')); } finally { loading.value = false; }
}
async function saveChannel() {
  if (!canConfigure.value) return;
  loading.value = true; error.value = '';
  try { await actions.saveChannel(shopId.value, storeId.value, { inventoryChannelId: channel.value?.inventoryChannelId, channelTypeEnumId: 'SICT_PRE_ORDER', facilityGroupId: facilityGroupId.value, shopifyLocationId: shopifyLocationId.value }); await showToast(translate('Pre-order channel saved.')); } catch (err) { error.value = errorMessage(err, translate('Failed to save the pre-order channel.')); } finally { loading.value = false; }
}
async function confirmParking(purpose: { id: string; label: string }) {
  const facilityId = parkingSelections.value[purpose.id];
  if (!canConfigure.value || !facilityId || loading.value) return;
  const alert = await alertController.create({
    header: translate('Activate parking facility'),
    message: `${translate(purpose.label)}: ${seed.facilityName(facilityId)} (${facilityId}). ${translate('This takes effect now and replaces any active or scheduled mapping for this purpose in the selected store. Existing orders are not moved.')}`,
    buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: translate('Activate'), handler: () => { void saveParking(purpose.id, facilityId); } }],
  });
  await alert.present();
}
async function saveParking(purposeId: string, facilityId: string) {
  loading.value = true; error.value = '';
  try { await actions.saveParking(shopId.value, storeId.value, purposeId, facilityId); await showToast(translate('Parking facility activated.')); }
  catch (err) { error.value = errorMessage(err, translate('Failed to save the parking facility.')); }
  finally { loading.value = false; }
}
async function copySchedule(job: any) {
  if (!canConfigure.value || loading.value) return;
  const alert = await alertController.create({
    header: translate('Copy publishing schedule'),
    message: translate('Creates a paused copy with the same schedule and parameters. Review its scope before enabling it. A custom name keeps it separate from release defaults.'),
    inputs: [{ name: 'jobName', type: 'text', placeholder: translate('New schedule name'), value: `${job.jobName}_custom` }],
    buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: translate('Copy'), handler: (values: { jobName: string }) => {
      const newName = values.jobName?.trim();
      if (!newName || !/^[A-Za-z0-9_-]{1,100}$/.test(newName) || setup.value?.jobs?.some((row: any) => row.jobName === newName)) {
        void showToast(translate('Use a unique schedule name, up to 100 letters, numbers, underscores or hyphens.')); return false;
      }
      void saveScheduleCopy(job.jobName, newName);
    } }],
  });
  await alert.present();
}
async function saveScheduleCopy(jobName: string, newJobName: string) {
  loading.value = true; error.value = '';
  try { await actions.copyJob(shopId.value, storeId.value, jobName, newJobName); await showToast(translate('Schedule copied. Review its scope and enable it when ready.')); }
  catch (err) { error.value = errorMessage(err, translate('Failed to copy the publishing schedule.')); }
  finally { loading.value = false; }
}
async function changeJobState(job: any) {
  if (!canConfigure.value || loading.value) return;
  const paused = job.paused === 'Y' ? 'N' : 'Y';
  const alert = await alertController.create({
    header: paused === 'N' ? translate('Enable publishing job') : translate('Pause publishing job'),
    message: `${job.jobName}. ${job.scope || translate('This job has no shop scope and may affect all stores.')} ${translate('The existing schedule and parameters will be preserved.')}`,
    buttons: [{ text: translate('Cancel'), role: 'cancel' }, { text: paused === 'N' ? translate('Enable') : translate('Pause'), handler: () => { void saveJobState(job.jobName, paused); } }],
  });
  await alert.present();
}
async function saveJobState(jobName: string, paused: 'Y' | 'N') {
  loading.value = true; error.value = '';
  try { await actions.setJobPaused(shopId.value, storeId.value, jobName, paused); await showToast(translate('Publishing job updated.')); }
  catch (err) { error.value = errorMessage(err, translate('Failed to update the publishing job.')); }
  finally { loading.value = false; }
}
onIonViewWillEnter(load);
</script>
