# pre-order

HotWax Commerce - Pre-Order App

## Firebase Hosting

We are using firebase hosting for the Pre-order app deployment
Here are the steps to deploy app on firebase hosting

### Prerequisite

- [Firebase Cli](https://firebase.google.com/docs/cli) should be installed
- Firebase project should be created
- You should have access to firebase project

### Dev deployment

- Update the DEV instance url at .env.production file

- Build the application using following command
  `ionic build`

## How to build application in different environment or modes(staging, production, qa, etc)?

As there is a bug in Ionic cli due to which we cannot pass flag variables for commands (See [#4669](https://github.com/ionic-team/ionic-cli/issues/4642)). To build application in different modes we need to use vue-cli-service to build and then use the built app using capacitor copy command further.

Follow following instructions:

1. Manually build the application using vue-cli-service:
   npx vue-cli-service build --mode=sandbox

2. Copy web assets to the native project without building the app:
   ionic capacitor copy ios --no-build

3. Open the Android Studio / XCode project:
   ionic capacitor open android  
   ionic capacitor open ios
