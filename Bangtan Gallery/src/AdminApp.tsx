import AdminPanel from './components/AdminPanel';
import { BackendProvider } from './context/BackendContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';

/**
 * Standalone Admin Panel app — served from admin.html (for example
 * bangtangallery.online/admin). It is a completely separate bundle from
 * the public website: the public site no longer contains the admin code,
 * the /admin + #admin routes, or the hidden 3-tap entry. This app still
 * connects to the exact same Firebase backend, so everything published
 * here appears on the website immediately.
 */
export default function AdminApp() {
  return (
    <BackendProvider>
      <AudioPlayerProvider>
        <div className="min-h-screen bg-[#05000a] text-white">
          <AdminPanel
            onClose={() => { window.location.href = '/'; }}
            publicThemeConfig={null}
            onThemeConfigChange={() => {}}
            onPublishSuccess={() => {}}
          />
        </div>
      </AudioPlayerProvider>
    </BackendProvider>
  );
}
