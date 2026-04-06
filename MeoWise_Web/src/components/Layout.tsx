import { useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import Logo from './Logo';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const triggerHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {}
  }
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNative, setIsNative] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
      const mainPages = ['/dashboard', '/feeding', '/report', '/profile'];
      const currentIndex = mainPages.indexOf(location.pathname);

      if (diffX > 0 && currentIndex > 0) {
        triggerHaptic();
        navigate(mainPages[currentIndex - 1]);
      } else if (diffX < 0 && currentIndex < mainPages.length - 1) {
        triggerHaptic();
        navigate(mainPages[currentIndex + 1]);
      }
    }
  }, [location.pathname, navigate]);

  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: '首页' },
    { path: '/feeding', icon: 'restaurant', label: '喂食' },
    { path: '/report', icon: 'bar_chart', label: '报告' },
    { path: '/profile', icon: 'person', label: '我的' },
  ];

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return '控制面板';
      case '/feeding': return '喂食管理';
      case '/report': return '数据报告';
      case '/profile': return '个人中心';
      default: return '喵食记';
    }
  };

  // Check if current page is a sub-page (has back button)
  const isSubPage = () => {
    return location.pathname !== '/dashboard' && 
           location.pathname !== '/feeding' && 
           location.pathname !== '/report' && 
           location.pathname !== '/profile';
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Status Bar Spacer for Native Apps */}
      {isNative && <div className="h-[env(safe-area-inset-top,0px)] bg-background" />}
      
      {/* Header - Mobile First Design */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          {/* Left side - Back or Logo */}
          <div className="flex items-center gap-3">
            {isSubPage() ? (
              <button 
                onClick={() => navigate(-1)}
                className="tap-target flex items-center justify-center -ml-2 text-primary"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            ) : (
              <Logo className="w-8 h-8" textClassName="text-xl text-primary" />
            )}
            <h1 className="font-headline text-lg font-bold text-on-background">
              {getTitle()}
            </h1>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            {/* Only show notifications on main pages */}
            {!isSubPage() && (
              <button className="tap-target flex items-center justify-center text-secondary hover:text-primary transition-colors rounded-full">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - With padding for bottom nav */}
      <main 
        className="flex-grow w-full max-w-lg mx-auto px-4 pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation - Fixed Mobile Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-outline-variant/20">
        {/* Safe area padding for iPhone */}
        <div className="pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex justify-around items-center max-w-lg mx-auto py-2 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all tap-target",
                    isActive
                      ? "text-primary bg-primary-container/20"
                      : "text-secondary hover:text-primary"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={clsx(
                        "material-symbols-outlined text-2xl mb-0.5 transition-all",
                        isActive && "scale-110"
                      )}
                      style={{ 
                        fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" 
                      }}
                    >
                      {item.icon}
                    </span>
                    <span className="font-label text-[10px] font-medium">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-[calc(72px+env(safe-area-inset-bottom,0px))]" />
    </div>
  );
}
