<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon :icon="close" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ $t("Background jobs") }}</ion-title>
    </ion-toolbar>
  </ion-header>

 <ion-content class="ion-padding">
   <!-- Empty state -->
   <div class="empty-state" v-if="jobTotal === 0" >
     <img src="../assets/images/JobsEmptyState.png"/>
     <p>{{ $t("There are no jobs running the in the background right now.")}}</p>
   </div>

   <!-- Active jobs -->
   <div v-else>
     <ion-list>
       <ion-list-header>{{ $t("Active jobs") }}</ion-list-header>
       <ion-item  v-bind:key="job.jobId" v-for="job in jobs">
         <ion-icon slot="start" :icon="cloudUpload" />
         <ion-label>{{ job.scriptTitle ? job.scriptTitle : job.description }}</ion-label>
         <ion-note slot="end"> {{ job.createdDate ? $filters.formatDate(job.createdDate, undefined, "YYYY-MM-DD HH:mm:ss.SSS") : '-'  }}</ion-note>          
       </ion-item>
     </ion-list>
    </div> 
  </ion-content>
</template>

<script>
import { 
  IonButtons,
  IonButton,
  IonContent,
  IonLabel,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  modalController } from "@ionic/vue";
import { defineComponent } from "vue";
import { cloudUpload, cloudDownload, build, close } from "ionicons/icons";
import { JobService } from '@/services/JobService'
import { useStore } from "@/store";
import { mapGetters } from "vuex";

export default defineComponent({
  name: "BackgroundJobModal",
  computed: {
    ...mapGetters({
      jobs: 'job/getList',
      jobTotal: 'job/getTotal'
    }),

  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    fetchJobs() {
      this.store.dispatch("job/fetchJobs", JobService.prepareFetchJobsQuery());
    }
  },
  beforeMount () {
    this.fetchJobs();
  },

  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonLabel,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonListHeader,
    IonNote,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const store = useStore();
    return {
      cloudUpload,
      cloudDownload,
      build,
      close,
      store
    };
  },
});
</script>

<style scoped>

.empty-state {
  height: 100%;
}
.empty-state > img {
  max-width: 100%;
  max-height: 80%;
}

</style>
