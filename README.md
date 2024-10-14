![image](https://user-images.githubusercontent.com/15027245/148551077-087685a0-8800-4a54-9a51-d02726dee916.png)


## Prerequisite  📱

Make sure you have the Ionic CLI installed. If not, check out the [official documentation](https://ionicframework.com/docs/intro/cli) for installation instructions.

---

## 🛠️  Build Notes for Users 

1. **Download** the app from the [release](https://github.com/hotwax/pickingapp/releases) page and extract it.
2. **Navigate** to the app directory.
3. Run the following command to download dependencies:  
   ```bash
   npm install

4. Create a `.env` file by taking reference from the `.env.example`.
5. To run the app in browser use the command: `ionic serve`


# 👩‍💻 For Contributors 

1. Open a Terminal window
2. Clone app using the command: `git clone https://github.com/hotwax/preorder.git <repository-name>`
3. Go to the <repository-name> directory using command: `cd <repository-name>`
4. Run following command to download dependencies
    `npm i`
5. Create a `.env` file by taking reference from the `.env.example`.
6. To run the app in browser use the command: `ionic serve`

# 🌐 Firebase Hosting 🌐

We're using Firebase Hosting for the Pre-order app deployment. Here’s how to deploy:

## 🔑 Prerequisite

- *Install the [Firebase Cli](https://firebase.google.com/docs/cli) 
- Create a Firebase project.
- Ensure you have access to the project.

## 🚀 Dev Deployment Steps

- 1. Update the DEV instance URL in the .env.production file.

- 2. Build the application:
  `ionic build`

- 3. Log in to Firebase:
  `firebase login`

- 4. Deploy to Firebase Hosting: 
  `firebase deploy --only hosting:<hosting url>`

## 🌍 Building for Different Environments

Due to a bug in the Ionic CLI, we need to use vue-cli-service for building different modes (staging, production, QA, etc.):

1. Manually build the application:
   npx vue-cli-service build --mode=sandbox

2. Copy web assets to the native project without building the app:
   ionic capacitor copy ios --no-build

3. Open the project Android Studio or XCode:
   ionic capacitor open android  
   ionic capacitor open ios

# Contribution Guideline

🤝 Contribution Guidelines

1. Fork the repository and clone it locally from the main branch. Ensure it’s up to date.
2. Pick an issue from [here](https://github.com/hotwax/preorder/issues) and comment if you want to take it on. Stay assigned to one issue at a time to avoid blocking others.
3. Create a branch for your edits using the naming convention: preorder/issue-number.
Add the issue number to your commit message.
Propose a Pull Request to the main branch with the issue number and title.
Use the [Pull Request template](https://github.com/hotwax/preorder/blob/main/.github/PULL_REQUEST_TEMPLATE.md)and fill in as much detail as possible.
Reference any relevant issues or information in your PR.
Wait for a review and adjust your PR as needed.
Congrats! 🎉 Your PR should now be merged!
If you encounter any issues or need help, feel free to ask!


## 🐞 Reporting Bugs or Requesting Features

Always specify the type of issue:

Bug report
Feature request
Be as specific as possible when writing issues. For implementation support or setup questions, reach out to the community!
    
    
# 🎨 UI/UX Resources

You can find helpful resources for improving the UI/UX of the app <a href="https://www.figma.com/community/file/885791511781717756" target="_blank">here</a>. 

# 💬 Join the Community on Discord

Have questions or ideas? Join our <a href="https://discord.gg/SwpJnpdyg3" target="_blank">Discord channel</a>!

    
# 📄 License

The Pre-order app is completely free and released under the Apache v2.0 License. Check out the <a href="https://github.com/hotwax/preorder/blob/main/LICENSE" target="_blank">LICENSE</a> for more details.

Thank you for being part of our community! Together, let’s make pre-ordering seamless! 🎊

