<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="login(form)" @submit.prevent="login(form)">
          <img src="../assets/images/hc.png"/>

          <ion-item lines="full" v-if="!baseURL">
            <ion-label position="fixed">{{ $t("OMS") }}</ion-label>
            <ion-input name="instanceUrl" v-model="instanceUrl" id="instanceUrl" type="text" required />
          </ion-item>
          <ion-item lines="full">
            <ion-label position="fixed">{{ $t("Username") }}</ion-label>
            <ion-input name="username" v-model="username" id="username"  type="text" required />
          </ion-item>
          <ion-item lines="none">
            <ion-label position="fixed">{{ $t("Password") }}</ion-label>
            <ion-input name="password" v-model="password" id="password" type="password" required />
          </ion-item>

          <div class="ion-padding">
            <ion-button type="submit" color="primary" fill="outline" expand="block">{{ $t("Login") }}</ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { 
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage } from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "./../store";
import { mapGetters } from 'vuex';

export default defineComponent({
  name: "login",
  components: {
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonPage
  },
  data() {
    return {
      username: "",
      password: "",
      instanceUrl: "",
      baseURL: process.env.VUE_APP_BASE_URL,
      alias: process.env.VUE_APP_ALIAS ? JSON.parse(process.env.VUE_APP_ALIAS) : {},
      defaultAlias: process.env.VUE_APP_DEFAULT_ALIAS,
    };
  },
  computed: {
    ...mapGetters({
      currentInstanceUrl: 'user/getInstanceUrl'
    })
  },
  mounted() {
    this.instanceUrl = this.currentInstanceUrl;
    if (this.currentInstanceUrl) {
      // If the current URL is available in alias show it for consistency
      const currentInstanceUrlAlias = Object.keys(this.alias).find((key) => this.alias[key] === this.currentInstanceUrl);
      currentInstanceUrlAlias && (this.instanceUrl = currentInstanceUrlAlias);
    }
    // If there is no current preference set the default one
    if (!this.instanceUrl && this.defaultAlias) {
      this.instanceUrl = this.defaultAlias;
    }
  },
  methods: {
    login: function () {
      const instanceURL = this.instanceUrl.trim().toLowerCase();
      if(!this.baseURL) this.store.dispatch("user/setUserInstanceUrl", this.alias[instanceURL] ? this.alias[instanceURL] : instanceURL);
      
      const { username, password } = this;
      this.store.dispatch("user/login", { username: username.trim(), password }).then((data: any) => {
        if (data.token) {
          this.username = ''
          this.password = ''
          this.$router.push('/')
        }
      }).catch((error: any) => {
        console.error("error", error);
      })
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    return { router, store };
  }
});
</script>
<style scoped>

.login-container {
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
