import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import MainScreen from './MainScreen';
import SearchScreen from './SearchScreen';
import AddSpaceScreen from './AddSpaceScreen';
import BookingsScreen from './BookingsScreen';
import ProfileScreen from './ProfileScreen';
import MyListedSpacesScreen from './MyListedSpacesScreen';
import EditProfileScreen from './EditProfileScreen';
import EditSpaceScreen from './EditSpaceScreen';
import PaymentMethodsScreen from './PaymentMethodsScreen';
import HelpSupportScreen from './HelpSupportScreen';
import PaymentScreen from './PaymentScreen';
import OwnerDashboard from './OwnerDashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  const [stripeKey, setStripeKey] = useState('');

  useEffect(() => {
    // Fetch Stripe publishable key from backend
    fetch('https://parkvana-production.up.railway.app/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        if (data.publishableKey) {
          setStripeKey(data.publishableKey);
        }
      })
      .catch(error => {
        console.error('Error fetching Stripe key:', error);
      });
  }, []);

  // Don't render app until we have Stripe key
  if (!stripeKey) {
    return null;
  }

  return (
    <StripeProvider publishableKey={stripeKey}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0ba360',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ title: 'Sign Up' }}
          />
          <Stack.Screen 
            name="Main" 
            component={MainScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ title: 'Find Parking' }}
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen}
            options={{ title: 'Payment' }}
          />
          <Stack.Screen 
            name="AddSpace" 
            component={AddSpaceScreen}
            options={{ title: 'List Your Space' }}
          />
          <Stack.Screen 
            name="Bookings" 
            component={BookingsScreen}
            options={{ title: 'My Bookings' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
          <Stack.Screen 
            name="MyListedSpaces" 
            component={MyListedSpacesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="OwnerDashboard" 
            component={OwnerDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="EditSpace" 
            component={EditSpaceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PaymentMethods" 
            component={PaymentMethodsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HelpSupport" 
            component={HelpSupportScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}