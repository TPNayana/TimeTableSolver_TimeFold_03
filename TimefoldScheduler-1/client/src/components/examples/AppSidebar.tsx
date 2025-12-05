import { AppSidebar } from '../AppSidebar';

export default function AppSidebarExample() {
  return (
    <AppSidebar 
      onUploadClick={() => console.log('Upload clicked')}
      onNewClassClick={() => console.log('New class clicked')}
    />
  );
}
