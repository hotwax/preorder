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
      <div class="user-profile">
        <ion-card>
          <ion-item lines="full">
            <ion-avatar slot="start" v-if="userProfile?.partyImageUrl">
              <Image :src="userProfile.partyImageUrl"/>
            </ion-avatar>
            <!-- ion-no-padding to remove extra side/horizontal padding as additional padding 
            is added on sides from ion-item and ion-padding-vertical to compensate the removed
            vertical padding -->
            <ion-card-header class="ion-no-padding ion-padding-vertical">
              <ion-card-subtitle>{{ userProfile?.userLoginId }}</ion-card-subtitle>
              <ion-card-title>{{ userProfile.partyName }}</ion-card-title>
            </ion-card-header>
          </ion-item>
          <ion-button color="danger" @click="logout()">{{ $t("Logout") }}</ion-button>
          <ion-button :standalone-hidden="!hasPermission(Actions.APP_PWA_STANDALONE_ACCESS)" fill="outline" @click="goToLaunchpad()">
            {{ $t("Go to Launchpad") }}
            <ion-icon slot="end" :icon="openOutline" />
          </ion-button>
          <!-- Commenting this code as we currently do not have reset password functionality -->
          <!-- <ion-button fill="outline" color="medium">{{ $t("Reset password") }}</ion-button> -->
        </ion-card>
      </div>

      <div class="section-header">
        <h1>{{ $t('OMS') }}</h1>
      </div>
      <section>
        <DxpOmsInstanceNavigator />
        <DxpProductStoreSelector @updateEComStore="updateEComStore($event)"/>
      </section>
      <hr />

      <DxpAppVersionInfo />

      <section>
        <DxpProductIdentifier />
        <DxpTimeZoneSwitcher @timeZoneUpdated="timeZoneUpdated" />

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ $t("Order parking") }}
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            {{ $t("Select which order parkings to view and manage orders for. When no parking is selected, orders are fetched for Preorder and Backorder parking.") }}
          </ion-card-content>

          <ion-item lines="none">
            <ion-select :label="$t('Select parking')" multiple interface="popover" :value="currentOrderParking" @ionChange="updateOrderParking($event)" :placeholder="$t('Select parking')">
              <ion-select-option v-for="(facility, id) in virtualFacilities" :key="id" :value="id" >{{ facility }}</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-card>
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { codeWorkingOutline, openOutline, saveOutline, timeOutline, globeOutline, personCircleOutline} from 'ionicons/icons'
import { useStore } from "@/store";
import { Actions, hasPermission } from '@/authorization';
import { 
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar } from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters } from 'vuex'
import Image from '@/components/Image.vue';
import { DxpProductIdentifier } from '@hotwax/dxp-components';

export default defineComponent({
  name: "settings",
  components: {
    IonAvatar,
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    Image
  },
  setup() {
    const store = useStore();
    return { Actions, hasPermission, store, codeWorkingOutline, timeOutline, globeOutline, personCircleOutline, openOutline, saveOutline }
  },
  data() {
    return {
      baseURL: process.env.VUE_APP_BASE_URL
    }
  },
  computed: {
    ...mapGetters({
      userProfile: 'user/getUserProfile',
      currentOrderParking: 'user/getCurrentOrderParking',
      virtualFacilities: 'user/getVirtualFacilities'
    })
  },
  methods: {
    logout: function() {
      this.store.dispatch("user/logout", { isUserUnauthorised: false }).then((redirectionUrl) => {
        // if not having redirection url then redirect the user to launchpad
        if(!redirectionUrl) {
          const redirectUrl = window.location.origin + '/login'
          window.location.href = `${process.env.VUE_APP_LOGIN_URL}?isLoggedOut=true&redirectUrl=${redirectUrl}`
        }
      })
    },
    goToLaunchpad() {
      window.location.href = `${process.env.VUE_APP_LOGIN_URL}`
    },
    async timeZoneUpdated(tzId: string) {
      await this.store.dispatch("user/setUserTimeZone", tzId)
    },
    updateEComStore(selectedProductStore: any) {
      this.store.dispatch('user/setEComStore', selectedProductStore?.productStoreId)
    },
    updateOrderParking(event: any) {
      if(event.detail.value && this.userProfile && this.currentOrderParking !== event.detail.value) {
        this.store.dispatch("user/setOrderParking", event.detail.value)
      }
    }
  }
});
</script>

<style scoped>
  ion-card > ion-button {
    margin: var(--spacer-xs);
  }
  section {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    align-items: start;
  }
  .user-profile {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacer-xs) 10px 0px;
  }
</style>