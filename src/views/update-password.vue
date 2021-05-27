
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex">
        <v-form :validation-schema="validationSchema" validateOnMount=true class="update-password-container" @keyup.enter="updatePassword()" @submit.prevent="updatePassword()" v-slot="{ errors }">
          <img src="../assets/images/hc.png"/>
          <ion-item lines="none">
              <ion-icon slot="start" :icon="eye" />
              <ion-label>{{ $t('Show password') }}</ion-label>
              <ion-toggle slot="end" name="showPassword" color="primary" @ionChange="showPassword = !showPassword" :checked="showPassword"></ion-toggle>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Old password") }}</ion-label>
              <v-field name="oldPassword" v-slot="{ field }" >
                <ion-input name="oldPassword" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("New password") }}</ion-label>
              <v-field name="newPassword" ref="newPassword" v-slot="{ field }" >
                <ion-input name="newPassword" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Confirm new password") }}</ion-label>
              <v-field name="newPasswordVerify" v-slot="{ field }" >
                <ion-input name="newPasswordVerify" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <div class="ion-padding">
              <ion-button :disabled="getLength(errors)" type="submit" color="primary" fill="outline" expand="block">{{ $t("Update password") }}</ion-button>
          </div>
        </v-form>
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
import * as V from "vee-validate/dist/vee-validate";
import { defineRule } from "vee-validate/dist/vee-validate";
import { required, confirmed } from "@vee-validate/rules";
import { configure } from 'vee-validate';


// TODO move configure and rules to the App
// Default values
configure({
  validateOnBlur: true, // controls if `blur` events should trigger validation with `handleChange` handler
  validateOnChange: true, // controls if `change` events should trigger validation with `handleChange` handler
  validateOnInput: false, // controls if `input` events should trigger validation with `handleChange` handler
  validateOnModelUpdate: true, // controls if `update:modelValue` events should trigger validation with `handleChange` handler
});
defineRule('required', required);
// TODO check issue with existing regex rule
// Existing rule doesn't allows to pass long regex
// thus always for current pattern
defineRule('password', (value) => {
    const passwordPattern = '^(?=.*[!@#$&*])(?=.*[0-9]).{8,}$';
    // ^                         Start anchor
    // (?=.*[!@#$&*])            Ensure string has one special case letter.
    // (?=.*[0-9])               Ensure string has one digits.
    // .{8,}                     Ensure string is of length 8 or more
    // $
   const regex = new RegExp(passwordPattern);
   return regex.test(String(value));
});

// TODO check why this doesn't works when the confirm value changes
defineRule('confirmed', confirmed);

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
  computed: {
    getLength: function() {
      return function (obj) {
          return Object.keys(obj).length;
      };
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
    IonToggle,
    VField: V.Field,
    VForm: V.Form,
  },
  beforeMount() {
    this.username = this.$route.params.username;
  },
  setup() {
    const validationSchema = {
      'oldPassword': 'required',
      'newPassword': 'required|password',
      'newPasswordVerify': 'required|confirmed:@newPassword'
    };
    return {
      validationSchema,
      eye,
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
