<template>
  <ion-content>
    <ion-datetime
      @ionChange="onDateChange($event)"
      showDefaultButtons
      presentation="date"
    />
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonContent,
  IonDatetime,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "DateSelectionModal",
  components: {
    IonContent,
    IonDatetime
  },
  methods: {
    onDateChange(event: any) {
      modalController.dismiss(event.target.value);
    }
  }
});
</script>
  