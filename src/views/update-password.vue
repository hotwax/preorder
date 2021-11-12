
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex">
        <!-- TODO Handle enter key and prevent form submission -->
        <v-form :validation-schema="validationSchema" :initialValues="formData" validateOnMount=true class="update-password-container" @submit="updatePassword" v-slot="{ errors }">
          <img src="../assets/images/hc.png"/>
          <ion-item lines="none">
              <ion-icon slot="start" :icon="eye" />
              <ion-label>{{ $t('Show password') }}</ion-label>
              <ion-toggle slot="end" name="showPassword" color="primary" @ionChange="showPassword = !showPassword" :checked="showPassword"></ion-toggle>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Old password") }}</ion-label>
              <v-field name="currentPassword" v-slot="{ field }" >
                <ion-input name="currentPassword" :value="field" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("New password") }}</ion-label>
              <v-field name="newPassword" ref="newPassword" v-slot="{ field }" >
                <ion-input name="newPassword" :value="field" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Confirm new password") }}</ion-label>
              <v-field name="newPasswordVerify" v-slot="{ field }" >
                <ion-input name="newPasswordVerify" :value="field" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
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
import { defineComponent, ref } from "vue";
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
          username: '',
          showPassword: false,
          currentPassword: '',
          newPassword: '',
          newPasswordVerify: '',
          token: ''
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
    async updatePassword(form) {
      const { currentPassword, newPassword, newPasswordVerify } = form;
      const resp = await UserService.updatePassword({ 
        data: {
          username: this.username,
          currentPassword,
          newPassword,
          newPasswordVerify
        },
        headers: {
          Authorization:  'Bearer ' + this.token,
          'Content-Type': 'application/json'
        }
      });
      if (resp.status === 200 && resp.data) {
        if (!hasError(resp)) {
          form.currentPassword = '';
          form.newPassword = '';
          form.newPasswordVerify = '';
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
    this.token = this.$route.params.token;
  },
  setup() {
    const validationSchema = {
      'currentPassword': 'required',
      'newPassword': 'required|password',
      'newPasswordVerify': 'required|confirmed:@newPassword'
    };
    const formData = ref({
      currentPassword: '',
      newPassword: '',
      newPasswordVerify: ''
    });
    return {
      validationSchema,
      eye,
      formData
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
