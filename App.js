/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {View, Text, Button, Alert} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import dynamicLinks from '@react-native-firebase/dynamic-links';

const App = () => {
  const [name, setName] = React.useState('');
  const [originalName, setOriginalName] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dynamicLinks().onLink();
    dynamicLinks()
      .getInitialLink()
      .then((link) => {
        if (link) {
          const user = link.url.slice(39);
          setOriginalName(user);
          setName(user[0].toUpperCase() + user.slice(1));
        }
      });
    messaging().subscribeToTopic('all');
    checkPermission();
    createNotificationListeners();
    setLoading(false);
  }, []);

  const checkPermission = async () => {
    const enabled = await messaging().hasPermission();
    if (enabled) {
      getToken();
    } else {
      requestPermission();
    }
  };

  const getToken = async () => {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    // console.log(fcmToken);
    if (!fcmToken) {
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    }
  };

  const requestPermission = async () => {
    try {
      await messaging().requestPermission();
      getToken();
    } catch (e) {
      console.log('permission rejected');
    }
  };

  const createNotificationListeners = async () => {
    messaging().onMessage(async (notification) => {
      const {
        notification: {title, body},
      } = notification;
      displayNotification(title, body);
    });

    messaging().setBackgroundMessageHandler((notification) => {
      const {
        notification: {title, body},
      } = notification;
      displayNotification(title, body);
    });
  };

  const displayNotification = (title, body) => {
    Alert.alert(title, body, [{text: 'Ok'}], {cancelable: false});
  };

  const sendNotification = async () => {
    if (originalName) {
      await axios.post('https://sub.best-podcast-app.com/api/notification', {
        name: originalName,
      });
    }
  };
  if (loading) return null;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{fontSize: 25}}>This page is for {name}</Text>
      <Button title="Send notification" onPress={sendNotification} />
    </View>
  );
};

export default App;
