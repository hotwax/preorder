<template>
    <ion-content>
        <ion-datetime
						@ionChange="onDateChange($event)"
						showDefaultButtons
            presentation="date"
        >
				</ion-datetime>
			<!-- <ion-buttons slot="end">
				<ion-button color="primary" fill="clear">Cancel</ion-button> 
				<ion-button color="primary" fill="clear" @click="onDateChange($event)">Done</ion-button>
			</ion-buttons> -->
    </ion-content>
</template>
  
<script lang="ts">
import {
	// IonButton,
	// IonButtons,
	IonContent,
  IonDatetime,
	modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";

export default defineComponent({
	name: "DateSelectionModal",
	components: {
		IonContent,
		IonDatetime,
		// IonButtons,
		// IonButton
	},
	props: ['query'],
	methods: {
		onDateChange(event: any) {
			modalController.dismiss(event.target.value);
		},
		cancel(){
			console.log('cancel');
		},
	},
	setup() {	
		console.log('s');
		
	}
});
</script>

<style>
ion-modal {
  --width: 290px;
  --height: 400px;
  --border-radius: 8px;
}
</style>
  