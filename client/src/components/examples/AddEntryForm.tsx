import AddEntryForm from '../AddEntryForm';

export default function AddEntryFormExample() {
  return (
    <AddEntryForm 
      onSave={(entry) => console.log('Saving entry:', entry)}
      onCancel={() => console.log('Cancelled adding entry')}
    />
  );
}