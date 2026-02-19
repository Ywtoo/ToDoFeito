/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import PushNotification from 'react-native-push-notification';

console.log('[App] index.js startup');

PushNotification.configure({
  onRegister: function(token) {
    console.log('[PushNotification] onRegister', token);
  },
  onNotification: function(notification) {
    console.log('[PushNotification] onNotification', notification);
  },
  popInitialNotification: true,
  requestPermissions: Platform.OS === 'ios',
});

PushNotification.createChannel(
  {
    channelId: "completion-channel",
    channelName: "Tarefas",
    channelDescription: "Lembretes de tarefas concluídas",
    soundName: "default",
    importance: 4,
    vibrate: true,
  },
  (created) => console.log(`[index.js] createChannel returned '${created}'`)
);

AppRegistry.registerComponent(appName, () => App);
