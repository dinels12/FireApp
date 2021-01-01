/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
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
  const [name, setName] = React.useState('You need to use a dynamic link');
  const [originalName, setOriginalName] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    messaging().subscribeToTopic('all');
    checkPermission();
    createNotificationListeners();
    dynamic();
    const unsubscribe = dynamicLinks().onLink((link) => {
      if (link) {
        const user = link.url.slice(33, -4);
        setOriginalName(user);
        setName(`This Page is for ${user[0].toUpperCase()}${user.slice(1)}`);
      }
    });
    setLoading(false);
    return unsubscribe;
  }, []);

  const dynamic = () => {
    dynamicLinks()
      .getInitialLink()
      .then((link) => {
        if (link) {
          const user = link.url.slice(33, -4);
          setOriginalName(user);
          setName(`This Page is for ${user[0].toUpperCase()}${user.slice(1)}`);
        }
      });
  };

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
    if (!fcmToken) {
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    }
  };

  const requestPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        getToken();
      }
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

  if (loading) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{fontSize: 25}}>{name}</Text>
      {originalName ? (
        <Button title="Send notification" onPress={sendNotification} />
      ) : null}
    </View>
  );
};

export default App;
