<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="flex">
        <!-- TODO Handle enter key and prevent form submission -->
        <v-form :validation-schema="validationSchema" :initialValues="formData"  class="update-password-container" v-slot="{ validate, errors, resetForm, values }">
          <img src="../assets/images/hc.png"/>
          <ion-item lines="none">
              <ion-icon slot="start" :icon="eye" />
              <ion-label>{{ $t('Show password') }}</ion-label>
              <ion-toggle slot="end" name="showPassword" color="primary" @ionChange="showPassword = !showPassword" :checked="showPassword"></ion-toggle>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Old password") }}</ion-label>
              <v-field name="currentPassword" v-slot="{ field }" v-model="currentPassword">
                <ion-input name="currentPassword" v-model="currentPassword" :value="field.value" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item v-if="errors['currentPassword']" lines="none">
            <ion-label class="ion-text-wrap" color="medium">
              {{ $t(errors['currentPassword']) }}
            </ion-label>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("New password") }}</ion-label>
              <v-field name="newPassword"  v-slot="{ field }" v-model="newPassword">
                <ion-input name="newPassword"  v-model="newPassword" :value="newPassword" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item v-if="errors['newPassword']" lines="none">
            <ion-label class="ion-text-wrap" color="medium">
              {{ $t(errors['newPassword']) }}
            </ion-label>
          </ion-item>
          <ion-item lines="none">
              <ion-label>{{ $t("Confirm new password") }}</ion-label>
              <v-field name="newPasswordVerify"  v-slot="{ field }" v-model="newPasswordVerify">
                <ion-input name="newPasswordVerify" v-model="newPasswordVerify" :value="newPasswordVerify" v-bind="field" :type="showPassword ? 'text' : 'password'" required></ion-input>
              </v-field>
          </ion-item>
          <ion-item v-if="errors['newPasswordVerify']" lines="none">
            <ion-label class="ion-text-wrap" color="medium">
              {{ $t(errors['newPasswordVerify']) }}
            </ion-label>
          </ion-item>
          <div class="ion-padding">
              <ion-button @click="updatePassword(values, resetForm, validate, errors)" :disabled="getLength(errors)" color="primary" fill="outline" expand="block">{{ $t("Update password") }}</ion-button>
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
defineRule('required', (value) => {
  return required(value) ? true : 'Field is required';
});
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
   return regex.test(String(value)) ? true : "Password must contain at least 8 characters including one digit and one special character";
});

// TODO check why this doesn't works when the confirm value changes
defineRule('confirmed', (value, params) => {
  return confirmed(value, params) ? true : 'Password must match';
});

export default defineComponent({
  name: "update-password",
  data() {
      return {
          showPassword: false,
          username: '',
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
    async updatePassword(form, resetForm, validate) {
      const result = await validate()
      if (!result.valid) {
           return;
      }
      const { currentPassword, newPassword, newPasswordVerify } = form;
      try {
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
          this.username = '';
          this.showPassword = false
          this.currentPassword =''
          this.newPassword =''
          this.newPasswordVerify =''
          resetForm({
              ...form,
            currentPassword: '',
            newPassword: '',
            newPasswordVerify: ''
          })
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

      } catch (err) {
        this.showPassword = false
        this.currentPassword =''
        this.newPassword =''
        this.newPasswordVerify =''
        resetForm({
            ...form,
          currentPassword: '',
          newPassword: '',
          newPasswordVerify: ''
        })
        showToast(this.$t('Something went wrong'));
        console.error("error", err);
        return Promise.reject(new Error(err))
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
      formData,
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