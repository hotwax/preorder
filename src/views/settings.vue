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
        <ion-icon :icon="globeOutline" slot="start" />
        <ion-label>{{ $t("eCom Store") }}</ion-label>
        <ion-select interface="popover" :value="currentEComStore.productStoreId" @ionChange="setEComStore($event)">
          <ion-select-option v-for="store in (userProfile ? userProfile.stores : [])" :key="store.productStoreId" :value="store.productStoreId" >{{ store.storeName }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-icon :icon="codeWorkingOutline" slot="start"/>
        <ion-label>{{ $t("OMS") }}</ion-label>
        <p slot="end">{{ baseURL ? baseURL : instanceUrl }}</p>
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
import { codeWorkingOutline, globeOutline, timeOutline } from 'ionicons/icons'
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
    return { store, codeWorkingOutline, globeOutline, timeOutline }
  },
  data() {
    return {
      baseURL: process.env.VUE_APP_BASE_URL
    }
  },
  computed: {
    ...mapGetters({
      userProfile: 'user/getUserProfile',
      selectedBrand: 'user/getSelectedBrand',
      instanceUrl: 'user/getInstanceUrl',
      currentEComStore: 'user/getCurrentEComStore',
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
    },
    setEComStore(store: any) {
      if(this.userProfile) {
        this.store.dispatch('user/setEcomStore', {
          'eComStore': this.userProfile.stores.find((str: any) => str.productStoreId == store['detail'].value)
        })
      }
    },
  }
});
</script>
