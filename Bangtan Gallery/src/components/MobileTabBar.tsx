// Batch 189 — mobile bottom tab bar (owner picked option A over the refined
// drawer). App-style, fixed at the bottom on mobile only (lg:hidden); the
// desktop top nav (Batch 185) is untouched. Four direct tabs + More, which
// opens the bottom sheet (Batch 190) with every section. More is highlighted
// whenever the active tab is not one of the four. The bar slides away while
// the sheet is open. The visible tabs come from the caller so admin sidebar
// settings (showHome/showMembers/showMusic/showNews) are honoured.
import { Home, Users, Music, BookOpen, Ellipsis } from 'lucide-react';

const TAB_ICONS: Record<string, typeof Home> = {
  Home,
  Members: Users,
  Music,
  News: BookOpen,
};

export default function MobileTabBar({
  tabs,
  activeTab,
  onNavigate,
  onMore,
  hidden,
}: {
  tabs: string[];
  activeTab: string;
  onNavigate: (name: string) => void;
  onMore: () => void;
  hidden: boolean;
}) {
  const moreActive = !tabs.includes(activeTab);
  return (
    <nav
      aria-label="Mobile navigation"
      className={`mobile-tabbar fixed bottom-0 inset-x-0 z-50 lg:hidden transition-transform duration-300 ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mobile-tabbar-inner flex items-stretch border-t border-white/10 bg-[#0a0214]/95 backdrop-blur-xl">
        {tabs.map((name) => {
          const Icon = TAB_ICONS[name] || Home;
          const isActive = activeTab === name;
          return (
            <button
              key={name}
              onClick={() => onNavigate(name)}
              aria-label={name}
              aria-current={isActive ? 'page' : undefined}
              className={`mobile-tabbar-tab flex-1 flex flex-col items-center gap-0.5 py-2.5 cursor-pointer ${
                isActive ? 'mobile-tabbar-tab-active' : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-purple-300' : 'text-gray-400'}`} />
              <span
                className={`text-[10px] leading-none ${
                  isActive ? 'font-bold text-purple-200' : 'font-medium text-gray-400'
                }`}
              >
                {name}
              </span>
              <span
                className={`w-1 h-1 rounded-full mt-0.5 ${
                  isActive ? 'bg-purple-400' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
        <button
          onClick={onMore}
          aria-label="More sections"
          aria-current={moreActive ? 'page' : undefined}
          className={`mobile-tabbar-tab flex-1 flex flex-col items-center gap-0.5 py-2.5 cursor-pointer ${
            moreActive ? 'mobile-tabbar-tab-active' : ''
          }`}
        >
          <Ellipsis className={`w-5 h-5 ${moreActive ? 'text-purple-300' : 'text-gray-400'}`} />
          <span
            className={`text-[10px] leading-none ${
              moreActive ? 'font-bold text-purple-200' : 'font-medium text-gray-400'
            }`}
          >
            More
          </span>
          <span
            className={`w-1 h-1 rounded-full mt-0.5 ${
              moreActive ? 'bg-purple-400' : 'bg-transparent'
            }`}
          />
        </button>
      </div>
    </nav>
  );
}
