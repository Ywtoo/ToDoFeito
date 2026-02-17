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
  requestPermissions: false,
});

AppRegistry.registerComponent(appName, () => App);
