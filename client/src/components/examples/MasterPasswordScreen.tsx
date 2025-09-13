import MasterPasswordScreen from '../MasterPasswordScreen';

export default function MasterPasswordScreenExample() {
  return (
    <MasterPasswordScreen 
      onLogin={(email, password) => console.log('Login:', { email, passwordLength: password.length })}
      encryptionStatus="initializing"
      isLoading={false}
    />
  );
}