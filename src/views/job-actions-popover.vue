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
import { JobService } from "@/services/JobService";
import { hasError, showToast } from "@/utils";
import { translate } from "@/i18n";

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
      try {
        const resp = await JobService.runJobNow(this.job)
        if (!hasError(resp)) {
          showToast(translate('Service has been scheduled'))
          await this.store.dispatch('job/fetchCtgryAndBrkrngJobs')
        } else {
          showToast(translate('Something went wrong'))
        }
      } catch (error) {
        console.error(error)
        showToast(translate('Something went wrong'))
      } finally {
        this.closeJobActionsPopover()
      }
    },
    async openJobHistoryModal() {
      this.store.dispatch('util/getServiceStatusDesc')
      const jobHistoryModal = await modalController.create({
        component: JobHistoryModal,
        componentProps: { job: this.job }
      });
      await jobHistoryModal.present();

      jobHistoryModal.onDidDismiss().then(() => {
        jobHistoryModal.dismiss({ dismissed: true });
      })
      this.closeJobActionsPopover()
    },
    async cancelJob() {
      try {
        const resp = await JobService.cancelJob(this.job.jobId)
        if (!hasError(resp)) {
          showToast(translate('Job cancelled successfully'))
          await this.store.dispatch('job/fetchCtgryAndBrkrngJobs')
        } else {
          showToast(translate('Something went wrong, could not cancel the job'))
        }
      } catch (error) {
        console.error(error)
        showToast(translate('Something went wrong, could not cancel the job'))
      } finally {
        this.closeJobActionsPopover()
      }
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
            this.cancelJob()
          }
        }]
      });
      await alert.present();
    },
    async schdlInEvry15Mins() {
      try {
        const resp = await JobService.scheduleJob({ job: this.job, frequency: 'EVERY_15_MIN', runTime: '' })
        if (!hasError(resp)) {
          showToast(translate('Service has been scheduled'));
          await this.store.dispatch('job/fetchCtgryAndBrkrngJobs')
        } else {
          showToast(translate('Something went wrong'))
        }
      } catch (error) {
        console.error(error)
        showToast(translate('Something went wrong'))
      } finally {
        this.closeJobActionsPopover()
      }
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