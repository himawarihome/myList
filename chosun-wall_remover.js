// ==UserScript==
// @name         Chosun Paywall Remover
// @namespace    http://tampermonkey.net/
// @version      2026-05-29
// @description  Remove membership wall and restore full article using Fusion CMS
// @author       You
// @match        *://*.chosun.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @downloadURL  https://raw.githubusercontent.com/himawarihome/myList/refs/heads/main/chosun-wall_remover.js
// @updateURL    https://raw.githubusercontent.com/himawarihome/myList/refs/heads/main/chosun-wall_remover.js
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    const membershipWall = document.querySelector('.membership-wall');
    if (membershipWall == null) {
        console.warn('[Chosun] .membership-wall not found');
        return;
    }
    // membership-wall 관련 요소 제거
    //membershipWall.remove();

    // 본문 overflow 잠금 해제 (페이월이 scroll을 막는 경우)
    //document.body.style.overflow = '';
    //document.documentElement.style.overflow = '';

    // Fusion globalContent에서 본문 추출
    const fusion = unsafeWindow.Fusion;
    if (!fusion?.globalContent?.content_elements) {
        console.warn('[Chosun] Fusion.globalContent.content_elements not found');
        return;
    }

    function contentElementsToHTML(contentElements) {
        const FONT_FACE = `
            @font-face {
            font-family: "chosun-myeongjo";
            src: url("//www.chosun.com/ChosunNM.woff2") format("woff2"),
            url("//www.chosun.com/ChosunNM.woff") format("woff");
            font-weight: 400; font-style: normal; font-display: swap;
            }
            @font-face {
            font-family: "NotoSansKR-Regular";
            src: url("//www.chosun.com/NotoSansKR-Regular.woff2") format("woff2"),
            url("//www.chosun.com/NotoSansKR-Regular.woff") format("woff");
            font-weight: 400; font-style: normal; font-display: swap;
            }
            @font-face {
            font-family: "NotoSansKR-Bold";
            src: url("//www.chosun.com/NotoSansKR-Bold.woff2") format("woff2"),
            url("//www.chosun.com/NotoSansKR-Bold.woff") format("woff");
            font-weight: 700; font-style: normal; font-display: swap;
            }
            `;

        const CONTAINER = `max-width: 616px; margin: 0 auto; padding: 0 16px; box-sizing: border-box;`;

        const P_STYLE = `
            font-family: "chosun-myeongjo", "ChosunNM", Georgia, serif;
            font-size: 18px;
            line-height: 1.8;
            letter-spacing: -0.3px;
            color: #222222;
            text-align: left;
            word-break: keep-all;
            overflow-wrap: break-word;
            margin: 0 0 24px 0;
            padding: 0;
            `;

        const H_STYLE = (level) => {
            const sizes = { 1: '28px', 2: '24px', 3: '20px', 4: '18px' };
            const fs = sizes[level] || '18px';
            return `
                font-family: "NotoSansKR-Bold", "NotoSansKR-Regular", sans-serif;
                font-size: ${fs};
                font-weight: 700;
                line-height: 1.5;
                letter-spacing: -0.3px;
                color: #222222;
                word-break: keep-all;
                margin: 40px 0 16px 0;
                padding: 0;
                `;
        };

        const HR_STYLE = `width: 40px; border: none; border-top: 1px solid #222222; margin: 32px 0;`;

        const LI_STYLE = `
            font-family: "chosun-myeongjo", "ChosunNM", Georgia, serif;
            font-size: 18px;
            line-height: 1.8;
            letter-spacing: -0.3px;
            color: #222222;
            word-break: keep-all;
            overflow-wrap: break-word;
            margin-bottom: 8px;
            padding-left: 4px;
            `;

        const CAPTION_STYLE = `
            margin-top: 8px;
            font-family: "NotoSansKR-Regular", sans-serif;
            font-size: 14px;
            color: #707070;
            letter-spacing: -0.3px;
            word-break: keep-all;
            `;

        const inner = contentElements.map((el) => {
            switch (el.type) {

                case 'text': {
                    if (el.content == null || el.content === '') return '';
                    const alignStyle = el.alignment === 'center' ? 'text-align: center;' : '';
                    return `<p style="${P_STYLE} ${alignStyle}">${el.content}</p>`;
                }

                case 'header': {
                    const lvl = el.level ?? 2;
                    return `<h${lvl} style="${H_STYLE(lvl)}">${el.content ?? ''}</h${lvl}>`;
                }

                case 'raw_html': {
                    return `<div style="margin-bottom: 24px;">${el.content ?? ''}</div>`;
                }

                case 'divider': {
                    return `<hr style="${HR_STYLE}">`;
                }

                case 'list': {
                    const tag = el.list_type === 'ordered' ? 'ol' : 'ul';
                    const listStyle = el.list_type === 'ordered'
                        ? 'list-style-type: decimal;'
                        : 'list-style-type: disc;';
                    const items = (el.items ?? [])
                        .map(item => `<li style="${LI_STYLE}">${item.content ?? ''}</li>`)
                        .join('\n');
                    return `
                        <${tag} style="${listStyle} margin: 0 0 24px 0; padding-left: 24px;">
                        ${items}
                        </${tag}>`;
                }

                case 'image': {
                    const url = el.url ?? el.additional_properties?.originalUrl ?? '';
                    const caption = el.caption ?? '';
                    const alt = el.alt_text ?? caption ?? '';
                    const credit = el.credits?.affiliation?.[0]?.name ?? '';
                    const src = el.resizedUrls?.article_lg
                        ?? el.resizedUrls?.article_md
                        ?? url;

                    return `
                        <figure style="margin: 0 0 24px 0; padding: 0;">
                        <img src="${src}" alt="${alt}" style="width: 100%; display: block;" loading="lazy">
                        ${caption || credit
                        ? `<figcaption style="${CAPTION_STYLE}">${caption}${caption && credit ? ' ' : ''}${credit ? `/ ${credit}` : ''}</figcaption>`
                        : ''}
                        </figure>`;
                }

                case 'video': {
                    const thumb = el.promo_items?.basic?.url ?? '';
                    const title = el.headlines?.basic ?? '';
                    const mp4 = el.streams?.find(s => s.stream_type === 'mp4')?.url ?? '';
                    return `
                        <figure style="margin: 0 0 24px 0; padding: 0;">
                        <video controls poster="${thumb}" style="width: 100%; display: block;">
                        ${mp4 ? `<source src="${mp4}" type="video/mp4">` : ''}
                        </video>
                        ${title
                        ? `<figcaption style="${CAPTION_STYLE}">${title}</figcaption>`
                        : ''}
                        </figure>`;
                }

                default:
                    return el.content
                        ? `<div style="margin-bottom: 24px; font-family: 'chosun-myeongjo', serif; font-size: 18px; line-height: 1.8; color: #222;" data-type="${el.type}">${el.content}</div>`
                        : '';
            }
        }).join('\n');

        return `
            <style>${FONT_FACE}</style>
            <div style="${CONTAINER}">${inner}</div>
            `.trim();
    }

    const html = contentElementsToHTML(fusion.globalContent.content_elements);

    console.log(html);

    // 기존 본문 컨테이너를 찾아 교체
    const articleBody = document.querySelector('.article-body');
    if (articleBody == null) {
        console.warn('[Chosun] ..article-body not found');
        return;
    }
    articleBody.innerHTML = html;
    console.info('[Chosun] Article restored successfully');
})();
