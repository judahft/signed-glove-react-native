import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import base64 from 'react-native-base64';

import { Button, Typography } from '@components';
import routes from '@constants/routes';
import BleContext from '@contexts';

import styles from './styles';

export const exampleText = 'This is an example';
export const backButtonLabel = 'Go to Previous Screen';

export const backButtonTestId = 'backButtonTestId';

// Device's Serial Port service and write charasteristic
const serialServiceUUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const serialCharacteristicUUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

const Detail = ({ route }: DetailScreenProp) => {
  const { manager } = useContext(BleContext);
  const { deviceId } = route.params;
  const navigation = useNavigation<DetailScreenProp>();
  const [device, setDevice] = useState<Device>();
  const [value, setValue] = useState<string>('');

  const connectDevice = useCallback(async () => {
    const newDevice = await manager.connectToDevice(deviceId);
    setDevice(newDevice);
  }, []);

  const disconnectDevice = useCallback(async () => {
    if (device) {
      const isDeviceConnected = await device.isConnected();
      if (isDeviceConnected) {
        await device.cancelConnection();
      }
    }
    navigation.goBack();
  }, [device, navigation]);

  const handleSerialPortProtocol = useCallback(async () => {
    if (device) {
      await device.discoverAllServicesAndCharacteristics();
      manager.monitorCharacteristicForDevice(
        deviceId,
        serialServiceUUID,
        serialCharacteristicUUID,
        (error: any, charasteristic: any) => {
          if (error) setValue(error);
          if (charasteristic) {
            const newValue = base64.decode(charasteristic.value);
            if (value !== newValue) {
              setValue(newValue);
            }
          }
        },
      );
    }
  }, [device]);

  useEffect(() => {
    handleSerialPortProtocol();
  }, [handleSerialPortProtocol]);

  useEffect(() => {
    if (device) {
      device.onDisconnected(() => {
        navigation.navigate(routes.home);
      });
    }
  }, [device]);

  useEffect(() => {
    connectDevice();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.container}>
        <Button onPress={disconnectDevice}>Disconnect</Button>
        <View>
          <View>
            <Typography>{`Id : ${deviceId}`}</Typography>
            <Typography>{`Name : ${device?.name}`}</Typography>
            <Typography>{`ServiceData : ${device?.serviceData}`}</Typography>
            <Typography>{`UUIDS : ${device?.serviceUUIDs}`}</Typography>
          </View>
        </View>
        <View>
          <Typography customStyles={styles.value}>{value}</Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Detail;
