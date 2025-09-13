import MasterPasswordScreen from '../MasterPasswordScreen';

export default function MasterPasswordScreenExample() {
  return (
    <MasterPasswordScreen 
      onLogin={(email, password) => console.log('Login:', { email, passwordLength: password.length })}
      onBiometricLogin={() => console.log('Biometric authentication')}
      onWebAuthnLogin={() => console.log('WebAuthn authentication')}
      onPasswordlessLogin={(email) => console.log('Passwordless login for:', email)}
      encryptionStatus="initializing"
      isLoading={false}
      supportsBiometric={true}
      supportsWebAuthn={true}
    />
  );
}