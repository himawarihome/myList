// ==UserScript==
// @name         Chosun Wall Remover
// @description  Chosun Wall Remover
// @version      0.3.4
// @namespace    http://tampermonkey.net/
// @author       J W
// @match        *://*.chosun.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chosun.com
// @downloadURL  https://raw.githubusercontent.com/himawarihome/myList/refs/heads/main/chosun-wall_remover.js
// @updateURL    https://raw.githubusercontent.com/himawarihome/myList/refs/heads/main/chosun-wall_remover.js
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    const freeBanner = document.querySelector('.status-banner.free-banner');
    const membershipWall = document.querySelector('.membership-wall');
    if (freeBanner == null && membershipWall == null) {
        console.warn('[Chosun] .membership-wall not found');
        return;
    }
    // membership-wall 관련 요소 제거
    //membershipWall.remove();

    // 본문 overflow 잠금 해제 (페이월이 scroll을 막는 경우)
    //document.body.style.overflow = '';
    //document.documentElement.style.overflow = '';

    // Fusion globalContent에서 본문 추출
    //const fusion = unsafeWindow.Fusion;
	const fusion = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).Fusion;
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
	            	return `<p class="
		                article-body__content article-body__content-text |
		                text--black text font--size-sm-18 font--size-md-18 font--primary font--myeongjo text--line-height-md
		                ">${el.content}</p>`
                }

				case 'quote': {
					const isPullquote = el.subtype === 'pullquote';
					const citation = el.citation?.content ?? '';

					const inner = (el.content_elements ?? [])
						.map((item, i) => `
							<div style="
							font-family: 'NotoSansKR-Regular', 'Noto Sans KR', sans-serif;
							font-size: 20px;
							line-height: 0.7;
							letter-spacing: -0.3px;
							color: #222222;
							word-break: keep-all;
							${i > 0 ? 'margin-top: 16px;' : ''}
							">${item.content ?? ''}</div>
							`)
						.join('\n');

				// pullquote: 위아래 구분선 박스
				if (isPullquote) {
					return `
						<blockquote style="
						margin: 24px 0;
						padding: 20px 24px;
						background: #f8f8f8;
						border-top: 1px solid #9C9C9C;
						border-bottom: 1px solid #9C9C9C;
						box-sizing: border-box;
						">
						${inner}
						${citation
						? `<cite style="
							display: block;
							margin-top: 12px;
							font-family: 'NotoSansKR-Regular', sans-serif;
							font-size: 14px;
							color: #707070;
							font-style: normal;
							">${citation}</cite>`
						: ''}
						</blockquote>`;
				}

				// blockquote: 좌측 회색 세로줄 (실제 렌더링 기준)
				return `
					<blockquote style="
						margin: 24px 0;
						padding-left: 16px;
						border-left: 2px solid #BCBCBC;
						box-sizing: border-box;
					">
					${inner}
					${citation
					? `<cite style="
						display: block;
						margin-top: 12px;
						font-family: 'NotoSansKR-Regular', sans-serif;
						font-size: 14px;
						color: #707070;
						font-style: normal;
						">${citation}</cite>`
					: ''}
					</blockquote>`;
				}

                case 'header': {
                    const lvl = el.level ?? 2;
                    //return `<h${lvl} style="${H_STYLE(lvl)}">${el.content ?? ''}</h${lvl}>`;
					return `<h${lvl} class="h${lvl} font--tertiary"><b>${el.content}</b></h${lvl}>`;
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
                        .map(item => `<li class="content-list-item text--black content-list-item-first flex flex-wrap box--pad-top-xs">${item.content ?? ''}</li>`)
                        .join('\n');
                    return `
                        <${tag} class="article-body__content article-body__content-list font--size-sm-18 font--size-md-18 font--primary font--myeongjo text--line-height-md">
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

                case 'gallery': {
                    const title = el.headlines?.basic ?? '';
                    const images = (el.content_elements ?? [])
                        .filter(img => img.type === 'image')
                        .map(img => {
                                        const src = img.resizedUrls?.article_lg
                                            ?? img.resizedUrls?.article_md
                                            ?? img.url ?? '';
                                        const caption = img.subtitle || img.caption || '';
                                        const alt = img.subtitle ?? '';

                                        return `
                                            <figure style="margin: 0 0 12px 0; padding: 0;">
                                            <img
                                            src="${src}"
                                            alt="${alt}"
                                            style="width: 100%; display: block;"
                                            loading="lazy"
                                            >
                                            ${caption
                                                ? `<figcaption style="
                                                margin-top: 8px;
                                                font-family: 'NotoSansKR-Regular', sans-serif;
                                                font-size: 14px;
                                                color: #707070;
                                                letter-spacing: -0.3px;
                                                word-break: keep-all;
                                                ">${caption}</figcaption>`
                                                : ''}
                                                </figure>`;
                                    })
                            .join('\n');

                    return `
                        <div style="margin-bottom: 24px;">
                        ${title
                        ? `<p style="
                        font-family: 'NotoSansKR-Regular', sans-serif;
                        font-size: 14px;
                        color: #707070;
                        margin: 0 0 12px 0;
                        ">${title}</p>`
                    : ''}
                    ${images}
                    </div>`;
                }

				case 'oembed_response': {
					const embedHtml = el.raw_oembed?.html ?? '';
					if (!embedHtml) return '';

					const isYoutube = el.subtype === 'youtube';

					// 유튜브는 16:9 비율 반응형 래퍼로 감싸기	
					if (isYoutube) {
						return `
							<div style="
								position: relative;
								width: 100%;
								padding-bottom: 56.25%; /* 16:9 비율 */
								height: 0;
								overflow: hidden;
								margin: 0 0 24px 0;
								">
							<div style="
								position: absolute;
								top: 0; left: 0;
								width: 100%; height: 100%;
								">
							${embedHtml.replace(
								/width="[^"]*"/, 'width="100%"'
								).replace(
								/height="[^"]*"/, 'height="100%"'
								).replace(
								/<iframe/, '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"'
								)}
							</div>
							</div>`;
					}

					// 그 외 oembed (트위터 등): raw html 그대로
					alert('!!!!!!!!!NEW SUBTYPE of oembed_response!!!!!!!!!'+el.subtype);
					return `<div style="margin: 0 0 24px 0;">${embedHtml}</div>`;
				}
					
                default: {
					alert('!!!!!!!!!NEW TYPE!!!!!!!!!'+el.type);
                    return el.content
                        ? `<div style="margin-bottom: 24px; font-family: 'chosun-myeongjo', serif; font-size: 18px; line-height: 1.8; color: #222;" data-type="${el.type}">${el.content}</div>`
                        : '';
				}
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
