# Toolbox Android development preview

Use Node.js 22 or later, JDK 21, Android Studio and Android SDK Platform 36. From the repository root run:

```sh
npm ci
npm test
npm run android:sync
npm run android:open
```

In Android Studio select the app debug variant and run on a connected phone. Alternatively, run `./gradlew assembleDebug` inside the android folder. The output is `android/app/build/outputs/apk/debug/app-debug.apk`. Run the sync command again after changing web assets.

The debug package uses com.bulletproofseafarer.toolbox.dev and separate device storage. Toolbox opens toolbox2.html from its installed assets. Use sample documents for this build. Sign-in, paid Cloud, and Play checkout are separate release work.

On the phone, save a sample document, open a mock exam, force close Toolbox and launch it in airplane mode. Check the saved photo, keyboard visibility, and exam access.
