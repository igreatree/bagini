import { Suspense } from "react";
import Script from "next/script";
import { YANDEX_METRIKA_ID } from "@/constants";
import { YandexMetrikaHits } from "./Hits";

// Сниппет счётчика Яндекс Метрики. dataLayer нужен для ecommerce: "dataLayer"
const initScript = `
window.dataLayer = window.dataLayer || [];
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.webvisor.org/metrika/tag_ww.js?id=${YANDEX_METRIKA_ID}', 'ym');

ym(${YANDEX_METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

export const YandexMetrika = () => (
    <>
        <Script id="yandex-metrika" strategy="afterInteractive">
            {initScript}
        </Script>
        <noscript>
            <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
                    style={{ position: "absolute", left: -9999 }}
                    alt=""
                />
            </div>
        </noscript>
        {/* useSearchParams требует Suspense, иначе статические страницы не соберутся */}
        <Suspense fallback={null}>
            <YandexMetrikaHits />
        </Suspense>
    </>
);
