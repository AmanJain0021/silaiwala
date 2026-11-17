// /partner/register -> /partner/signup (web: <Navigate replace />)
import React from 'react';
import { Redirect } from 'expo-router';

export default function Register() {
  return <Redirect href="/partner/signup" />;
}
