<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeJobHistoryModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ job?.jobTitle }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <div v-if="jobHistory?.length === 0">
      <p class="ion-text-center">{{ $t("No jobs have run yet")}}</p>
    </div>

    <div v-else>
      <ion-list>
        <ion-item v-for="(job, index) in jobHistory" :key="index">
          <ion-label>
            {{ job.runTime ? getTime(job.runTime) : "-" }}
            <p v-if="job.runTime">{{ getDate(job.runTime) }}</p>
          </ion-label>
          <ion-badge v-if="job.statusId" :color="job.statusId === 'SERVICE_FINISHED' ? 'success' : 'danger'">{{ getStatusDesc(job.statusId) }}</ion-badge>
        </ion-item>
      </ion-list>
    </div>
  </ion-content>
</template>

<script lang="ts">
import {
  IonButtons,
  IonButton,
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { closeOutline } from 'ionicons/icons';
import { mapGetters, useStore } from 'vuex';
import { DateTime } from 'luxon';
import { JobService } from '@/services/JobService'
import { hasError } from '@/utils';

export default defineComponent({
  name: 'JobHistoryModal',
  components: {
    IonButtons,
    IonButton,
    IonBadge,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      jobHistory: [] as any
    }
  },
  props: ['job'],
  computed: {
    ...mapGetters({
      currentEComStore: 'user/getCurrentEComStore',
      getStatusDesc: 'util/getStatusDesc'
    })
  },
  methods: {
    closeJobHistoryModal() {
      modalController.dismiss({ dismissed: true });
    },
    getDate (runTime: any) {
      return DateTime.fromMillis(runTime).toLocaleString(DateTime.DATE_MED);
    },
    getTime (runTime: any) {
      return DateTime.fromMillis(runTime).toLocaleString(DateTime.TIME_SIMPLE);
    },
    async fetchJobHistory() {
      let resp;

      try {
        resp = await JobService.fetchJobInformation({
          "inputFields": {
            "productStoreId": this.currentEComStore.productStoreId,
            "statusId": ["SERVICE_CANCELLED", "SERVICE_CRASHED", "SERVICE_FAILED", "SERVICE_FINISHED"],
            "statusId_op": "in",
            "systemJobEnumId": this.job.systemJobEnumId
          },
          "fieldList": [ "runTime", "statusId" ],
          "noConditionFind": "Y",
          "viewSize": process.env.VUE_APP_VIEW_SIZE,
          "orderBy": "runTime DESC"
        })
        if(!hasError(resp)) {
          this.jobHistory = resp.data.docs;
        } else {
          this.jobHistory = [];
        }
      } catch(err) {
        console.error(err);
      }
    }
  },
  async mounted() {
    await this.fetchJobHistory()
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      store
    };
  },
});
</script>