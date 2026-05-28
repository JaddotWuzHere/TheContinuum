import { i18n } from "../i18n"
import { FullSlug, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { localeFromSlug, toI18nLocale } from "../util/locale"



export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
  }: QuartzComponentProps) => {

    const lang = localeFromSlug(fileData?.slug ?? "/en/")
    const htmlLang = toI18nLocale(lang)
    const dict = i18n(htmlLang)
    const t = dict

    const titleSuffix = t.layout.pageTitleSuffix ?? ""
    const title = (fileData.frontmatter?.title ?? t.propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? dict.propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    const deviceModeScript = `
    (function () {
      var root = document.documentElement;

      function hasMedia(query) {
        return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
      }

      function isMobileLikeDevice() {
        var ua = navigator.userAgent || "";
        var maxTouchPoints = navigator.maxTouchPoints || 0;

        var mobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        var iPadLike = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);

        var coarsePointer = hasMedia("(pointer: coarse)");
        var finePointer = hasMedia("(pointer: fine)");
        var noHover = hasMedia("(hover: none)");
        var hover = hasMedia("(hover: hover)");

        var touchCapable = maxTouchPoints > 0;
        var smallestScreenSide = Math.min(screen.width || window.innerWidth, screen.height || window.innerHeight);
        var physicallySmallScreen = smallestScreenSide <= 900;

        if (mobileUA || iPadLike) return true;

        if ((coarsePointer || touchCapable) && noHover) return true;

        if ((coarsePointer || touchCapable) && !finePointer && !hover && physicallySmallScreen) {
          return true;
        }

        return false;
      }

      function applyDeviceMode() {
        var mobile = isMobileLikeDevice();

        root.classList.toggle("device-mobile", mobile);
        root.classList.toggle("device-desktop", !mobile);

        root.classList.toggle("viewport-compact", window.innerWidth < 1500);
        root.classList.toggle("viewport-narrow", window.innerWidth < 1200);

        var tiny = window.innerWidth < 700;
        var desktopTiny = !mobile && tiny;

        root.classList.toggle("viewport-tiny", tiny);

        if (desktopTiny) {
          root.removeAttribute("data-explorer-open");
          root.removeAttribute("data-settings-open");
          root.removeAttribute("data-mobile-tool-open");
          root.removeAttribute("data-page-scroll-locked");

          window.dispatchEvent(new Event("continuum-force-close-drawers"));
        }
      }

      root.removeAttribute("data-explorer-open");
      root.removeAttribute("data-settings-open");
      root.removeAttribute("data-mobile-tool-open");
      root.removeAttribute("data-page-scroll-locked");

      try {
        localStorage.removeItem("continuum-explorer-drawer");
        localStorage.removeItem("continuum-settings-drawer");
      } catch {}

      applyDeviceMode();

      window.addEventListener("resize", applyDeviceMode, { passive: true });
      window.addEventListener("orientationchange", applyDeviceMode, { passive: true });
    })();
    `
    

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const ogImagePath = `https://${cfg.baseUrl}/static/link_image.png`

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />

        <meta httpEquiv="content-language" content={htmlLang} />
        <script
          // sets <html lang="..."> very early since we can’t touch the outer <html> here
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('lang','${htmlLang}');`,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: deviceModeScript,
          }}
        />

        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        <meta property="og:image" content={ogImagePath} />
        <meta property="og:image:url" content={ogImagePath} />
        <meta name="twitter:image" content={ogImagePath} />
        <meta property="og:image:type" content="image/png" />

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor