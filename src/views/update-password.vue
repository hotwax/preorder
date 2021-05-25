
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex">
        <form class="update-password-container" @keyup.enter="updatePassword()" @submit.prevent="updatePassword()">
          <img src="../assets/images/hc.png"/>
          <ion-item lines="none">
              <ion-icon slot="start" :icon="eye" />
              <ion-label>{{ $t('Show password') }}</ion-label>
              <ion-toggle slot="end" name="showPassword" color="primary" @ionChange="showPassword = !showPassword" :checked="showPassword"></ion-toggle>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Old password") }}</ion-label>
              <ion-input v-model="oldPassword" :type="showPassword ? 'text' : 'password'" required></ion-input>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("New password") }}</ion-label>
              <ion-input v-model="newPassword" id="password" :type="showPassword ? 'text' : 'password'" required></ion-input>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Confirm new password") }}</ion-label>
              <ion-input v-model="newPasswordVerify" :type="showPassword ? 'text' : 'password'" required></ion-input>
          </ion-item>
          <div class="ion-padding">
              <ion-button type="submit" color="primary" fill="outline" expand="block">{{ $t("Update password") }}</ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonButton,
  IonContent,
  IonLabel,
  IonPage,
  IonIcon,
  IonInput,
  IonItem,
  IonToggle } from "@ionic/vue";
import { defineComponent } from "vue";
import { eye } from "ionicons/icons";
import { UserService } from '@/services/UserService'
import { hasError, showToast } from '@/utils'

export default defineComponent({
  name: "update-password",
  data() {
      return {
          showPassword: false,
          username: '',
          oldPassword: '',
          newPassword: '',
          newPasswordVerify: '',
      }
  },
  methods: {
    async updatePassword() {
      const { username, oldPassword, newPassword, newPasswordVerify } = this;
      const resp = await UserService.updatePassword({
        username,
        oldPassword,
        newPassword,
        newPasswordVerify
      });
      if (resp.status === 200 && resp.data) {
        if (!hasError(resp)) {
          this.username = '';
          this.oldPassword = '';
          this.newPassword = '';
          this.newPasswordVerify = '';
          showToast(this.$t('Password updated successfully'));
          this.$router.push({ name: 'login' })
        } else {
          showToast(this.$t('Password cannot be updated. Please try again.'));
          console.error("error", resp.data._ERROR_MESSAGE_);
        }
      } else {
        showToast(this.$t('Something went wrong'));
        console.error("error", resp.data._ERROR_MESSAGE_);
      }
    }
  },
  components: {
    IonButton,
    IonContent,
    IonLabel,
    IonPage,
    IonIcon,
    IonInput,
    IonItem,
    IonToggle
  },
  beforeMount() {
    this.username = this.$route.params.username;
  },
  setup() {
    return {
      eye
    };
  },
});
</script>

<style scoped>
.update-password-container {
  width: 375px;
}

img {
  margin-bottom: 25px;
  padding: 16px;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}


</style>
