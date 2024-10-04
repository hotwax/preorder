<template>
  <ion-content>
    <!-- Show "Schedule in every 15 minutes" option for draft jobs only -->
    <ion-list v-if="(job.statusId === 'SERVICE_DRAFT') || (job.paused === 'Y' && job.nextExecutionDateTime)">
      <ion-item lines="none" button @click="schdlInEvry15Mins()">
        <ion-icon slot="start" :icon="timerOutline" />
        {{ $t("Schedule in every 15 minutes") }}
      </ion-item>
    </ion-list>
    <ion-list v-else>
      <ion-item lines="none" button @click="runNow(job)">
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
  closeOutline,
  flashOutline,
  timeOutline,
  timerOutline,
} from "ionicons/icons";
import { defineComponent } from "vue";
import { useStore } from "@/store";
import JobHistoryModal from "./job-history-modal.vue";
import { JobService } from "@/services/JobService";
import { hasError, showToast } from "@/utils";
import { translate } from "@/i18n";

export default defineComponent({
  name: "JobActionsPopover",
  props: ["job", "isMaargJob"],
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
    async runNow(job: any) {
      let resp;

      try {
        if(this.isMaargJob) {
          if(!job.jobName) {
            resp = await JobService.scheduleMaargJob({ routingGroupId: job.routingGroupId, paused: 'Y' })
            if(hasError(resp)) {
              throw resp.data;
            }
            // Updating jobName as if the user again clicks the runNow button then in that we don't want to call the scheduleBrokering service
            job.jobName = resp.data.jobName
          }

          resp = await JobService.runMaargJobNow(job.routingGroupId)
        } else {
          resp = await JobService.runJobNow(job)
        }

        if (!hasError(resp)) {
          showToast(translate('Service has been scheduled'))
          await Promise.allSettled([this.store.dispatch('job/fetchBrokeringJob'), this.store.dispatch('job/fetchCtgryAndBrkrngJobs')])
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
      const jobHistoryModal = await modalController.create({
        component: JobHistoryModal,
        componentProps: { job: this.job, isMaargJob: this.isMaargJob }
      });
      return await jobHistoryModal.present();
    },
    async cancelJob() {
      try {
        const resp = await (this.isMaargJob ? JobService.scheduleMaargJob({ routingGroupId: this.job.routingGroupId, paused: 'Y' }) : JobService.cancelJob(this.job.jobId))

        if (!hasError(resp)) {
          showToast(translate('Job cancelled successfully'))
          await Promise.allSettled([this.store.dispatch('job/fetchBrokeringJob'), this.store.dispatch('job/fetchCtgryAndBrkrngJobs')])
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
        const resp = this.isMaargJob ?  await JobService.scheduleMaargJob({ routingGroupId: this.job.routingGroupId, paused: 'N', cronExpression: '0 */15 * ? * *' }) : await JobService.scheduleJob({ job: this.job, frequency: 'EVERY_15_MIN', runTime: '' })

        if (!hasError(resp)) {
          showToast(translate('Service has been scheduled'));
          await Promise.allSettled([this.store.dispatch('job/fetchBrokeringJob'), this.store.dispatch('job/fetchCtgryAndBrkrngJobs')])
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