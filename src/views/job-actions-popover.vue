<template>
  <ion-content>
    <!-- Show "Schedule in every 15 minutes" option for draft jobs only -->
    <ion-list v-if="job.statusId === 'SERVICE_DRAFT'">
      <ion-item lines="none" button @click="schdlInEvry15Mins()">
        <ion-icon slot="start" :icon="timerOutline" />
        {{ $t("Schedule in every 15 minutes") }}
      </ion-item>
    </ion-list>
    <ion-list v-else>
      <ion-item lines="none" button @click="runNow()">
        <ion-icon slot="start" :icon="flashOutline" />
        {{ $t("Run now") }}
      </ion-item>
      <ion-item lines="none" button @click="openJobHistoryModal()">
        <ion-icon slot="start" :icon="timeOutline" />
        {{ $t("History") }}
      </ion-item>
      <ion-item lines="none" button @click="confirmJobCancellation()">
        <ion-icon slot="start" :icon="closeOutline" />
        {{ $t("Cancel job") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
alertController,
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  modalController,
  popoverController,
} from "@ionic/vue";
import {
  closeOutline, flashOutline, timeOutline, timerOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import { useStore } from "@/store";
import JobHistoryModal from "./job-history-modal.vue";

export default defineComponent({
  name: "JobActionsPopover",
  props: ["job"],
  components: { 
    IonContent,
    IonIcon,
    IonItem,
    IonList
  },
  methods: {
    closeJobActionsPopover() {
      popoverController.dismiss({ dismissed: true });
    },
    async runNow() {
      await this.store.dispatch('job/runJobNow', this.job)
      this.closeJobActionsPopover()
    },
    async openJobHistoryModal() {
      const jobHistoryModal = await modalController.create({
        component: JobHistoryModal,
        componentProps: { job: this.job }
      });
      await jobHistoryModal.present();

      jobHistoryModal.onDidDismiss().then(() => {
        jobHistoryModal.dismiss({ dismissed: true });
      })
    },
    async confirmJobCancellation() {
      const alert = await alertController.create({
        header: this.$t("Cancel job"),
        message: this.$t("The job is currently in progress. Are you sure that you want to cancel this job?"),
        buttons: [{
          text: this.$t('No'),
          role: 'cancel',
        },
        {
          text: this.$t('Yes'),
          handler: async () => {
            this.closeJobActionsPopover()
            await this.store.dispatch('job/cancelJob', { jobId: this.job.jobId })
          }
        }]
      });
      await alert.present();
    },
    async schdlInEvry15Mins() {
      await this.store.dispatch('job/scheduleJob', { job: this.job, frequency: 'EVERY_15_MIN', runTime: '' })
      this.closeJobActionsPopover()
    }
  },
  setup() {
    const store = useStore();
    return {
      closeOutline,
      flashOutline,
      store,
      timeOutline,
      timerOutline
    }
  }
});
</script>