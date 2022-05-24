<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ $t("Settings") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-item>
        <ion-label>{{ $t("Brand") }}</ion-label>
        <ion-select @ionChange="updateBrand($event)" interface="popover" :value="selectedBrand">
          <ion-select-option value="">{{ $t("All") }}</ion-select-option>
          <ion-select-option v-bind:key="brand.id" v-for="brand in brands" :value="brand.id">{{ brand.name }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-icon :icon="codeWorkingOutline" slot="start"/>
        <ion-label>{{ $t("OMS") }}</ion-label>
        <p slot="end">{{ instanceUrl }}</p>
      </ion-item>
      <ion-item>
        <ion-icon :icon="timeOutline" slot="start"/>
        <ion-label> {{ userProfile && userProfile.userTimeZone ? userProfile.userTimeZone : '-' }} </ion-label>
        <ion-button @click="changeTimeZone()" slot="end" fill="outline" color="dark">{{ $t("Change") }}</ion-button>
      </ion-item>
      <ion-item>
        <ion-label> {{ userProfile !== null ? userProfile.partyName : '' }} </ion-label>
        <ion-button @click="logout" slot="end" fill="outline" color="dark">{{ $t("Logout") }}</ion-button>
      </ion-item>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { codeWorkingOutline, timeOutline } from 'ionicons/icons'
import { useStore } from "@/store";
import { 
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController } from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters } from 'vuex'
import TimeZoneModal from '@/views/timezone-modal.vue'

export default defineComponent({
  name: "settings",
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonMenuButton,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },
  setup() {
    const store = useStore();
    return { store, codeWorkingOutline, timeOutline }
  },
  data() {
    return {
      brands: JSON.parse(process.env.VUE_APP_BRANDS)
    }
  },
  computed: {
    ...mapGetters({
      userProfile: 'user/getUserProfile',
      selectedBrand: 'user/getSelectedBrand',
      instanceUrl: 'user/getInstanceUrl'
    })
  },
  methods: {
    logout: function() {
      this.store.dispatch("user/logout").then(() => {
        this.$router.push('/login')
      })
    },
    async changeTimeZone() {
      const timeZoneModal = await modalController.create({
        component: TimeZoneModal,
      });
      return timeZoneModal.present();
    },
    updateBrand(event: any) {
      this.store.dispatch("user/setSelectedBrand", { selectedBrand: event.detail.value})
    }
  }
});
</script>
