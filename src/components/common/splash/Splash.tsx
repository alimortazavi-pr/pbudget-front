import { APP_NAME_EN, APP_NAME_FA, LOGO_MARK_SRC } from "@/common/constants/brand";

/**
 * Server-rendered splash that covers the page until the app has hydrated, so
 * visitors never see half-built layouts. `SplashHider` lifts it; a pure-CSS
 * timeout does the same for no-JS visitors and crawlers (content stays in the
 * DOM underneath, so nothing is hidden from search engines).
 */
export function Splash() {
  return (
    <div id="pb-splash" aria-hidden="true">
      <div className="pb-splash-orb pb-splash-orb-a" />
      <div className="pb-splash-orb pb-splash-orb-b" />
      <div className="pb-splash-core">
        <span className="pb-splash-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- must render before any JS */}
          <img src={LOGO_MARK_SRC} alt="" width={76} height={76} />
        </span>
        <p className="pb-splash-name">{APP_NAME_FA}</p>
        <p className="pb-splash-sub">{APP_NAME_EN}</p>
        <span className="pb-splash-bar"><i /></span>
      </div>
    </div>
  );
}
