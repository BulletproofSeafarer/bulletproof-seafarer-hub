# Toolbox in Expo Go

This SDK 58 project opens the current Toolbox web preview inside an Expo Go WebView. It shares the web preview's source and serves the compiled screens on the same Metro URL as the Expo bundle. Use sample records during the walkthrough.

## Open it on an iPhone

Install or update Expo Go from the App Store. On your Mac, use Node 22.16 or newer and connect the Mac and iPhone to the same Wi-Fi network. From the root of the `toolbox-expo-go` branch, run:

```sh
npm --prefix toolbox-preview ci
npm --prefix toolbox-preview run build
npm --prefix toolbox-expo ci
npm --prefix toolbox-expo start
```

Scan the Expo QR code with the iPhone Camera and select **Open in Expo Go**. If the phone cannot reach Metro, allow Expo Go local network access and make sure the Wi-Fi network permits devices to reach one another. When a tunnel is available, `npm --prefix toolbox-expo run start:tunnel` can supply a QR code for a phone on another network.

## Walk through the current progress

1. Open **Documents** and tap **View voyage** to see which certificates are holding up the sample voyage.
2. Open **Tools**, tap **Book a medical exam**, and open **Find on map** for a provider. Website and map links open outside the preview.
3. Open **Profile** to see the Sea Service log and CV preview.

If you change the web source, run the web build again and restart Metro so it can pick up the new asset filenames.

This is a walkthrough of the current browser functionality. Expo Go wraps that UI without a signing or TestFlight change. The native document storage, iOS notifications, and automated sign-on to CV workflow are separate implementation work. Verify the iPhone file picker, external link behavior, and sharing on a physical device.
