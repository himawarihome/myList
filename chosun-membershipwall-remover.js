// ==UserScript==
// @name            Bypass Paywalls Clean - chosun.com
// @version         0.1.1
// @description     Bypass membership paywalls of chosun.com
// @author          magnolia1234(J W)
// @match           *://*.chosun.com/*
// @grant           none
// @require         https://gitflic.ru/project/magnolia1234/bypass-paywalls-clean-filters/blob/raw?file=userscript/bpc_func.js
// ==/UserScript==
(function() {
    const membershipBanner = document.querySelector('.article-membership-banner');
    //if (freeBanner == null && membershipWall == null) {
    if (membershipBanner == null) {
        //console.warn('[Chosun] .membership-banner not found');
        return;
    }

    // 1. Fusion CMS 전역 콘텐츠 제한 해제
    function crain_main() {
        if (window.Fusion) {
            window.Fusion.globalContent._id = 0;
            window.Fusion.globalContent.content_restrictions = {};
        }
    }
    window.setTimeout(function () {
        insert_script(crain_main);
    }, 100);

    // 2. fusion-metadata에서 기사 본문 추출 및 복원
    window.setTimeout(function () {
        let fusion_script = document.querySelector('script#fusion-metadata');
        if (fusion_script && fusion_script.text.includes('Fusion.globalContent=')) {
            let paywall_sel = '.membership-wall';
            let paywall = document.querySelector(paywall_sel);
            let article_sel = '.article-body';
            let article = document.querySelector(article_sel);

            if (paywall && article) {
                //removeDOMElement(paywall);
                try {
                    let json = JSON.parse(fusion_script.text.split('Fusion.globalContent=')[1].split(';Fusion.')[0]);
                    if (json) {
                        article.innerHTML = '';
                        let parser = new DOMParser();
                        let pars = json.content_elements;

                        for (let par of pars) {
                            let par_new;
                            if (['header', 'text'].includes(par.type)) {
                                if (par.content) {
                                    let doc = parser.parseFromString('<p class="article-body__content article-body__content-text | text--black text font--size-sm-18 font--size-md-18 font--primary font--myeongjo text--line-height-md">' + par.content + '</p>', 'text/html');
                                    par_new = doc.querySelector('p');
                                }
                            } else if (par.type === 'image') {
                                if (par.url) {
                                    let caption_text = par.caption;
                                    if (par.credits && par.credits.affiliation && par.credits.affiliation[0] && par.credits.affiliation[0].name)
                                        caption_text += ' (' + par.credits.affiliation[0].name + ')';
                                    par_new = makeFigure(par.url, caption_text);
                                }
                            } else if (par.type === 'raw_html') {
                                let doc = parser.parseFromString('<div>' + parseHtmlEntities(par.content) + '</div>', 'text/html');
                                par_new = doc.querySelector('div');
                            } else if (par.raw_oembed) {
                                if (par.raw_oembed._id) {
                                    par_new = document.createElement('p');
                                    let par_link = document.createElement('a');
                                    par_link.href = par_link.innerText = par.raw_oembed._id.replace(/\/$/, '');
                                    par_link.target = '_blank';
                                    par_new.appendChild(par_link);
                                }
                            } else if (par.type === 'video') {
                                if (par.canonical_url) {
                                    if (typeof domain !== 'undefined' && domain.startsWith(par.canonical_website)) {
                                        par_new = document.createElement('p');
                                        let par_link = document.createElement('a');
                                        par_link.href = par_link.innerText = 'https://www.' + domain + par.canonical_url.replace(/\/$/, '');
                                        par_link.target = '_blank';
                                        par_new.appendChild(par_link);
                                    } else
                                        console.log(par);
                                }
                            } else if (par.type === 'list') {
                                if (par.items) {
                                    let listTag = (par.list_type === 'ordered') ? 'ol' : 'ul';
                                    par_new = document.createElement(listTag);
                                    if (listTag === 'ol') {
                                        par_new.style.listStyleType = 'decimal';
                                        //par_new.style.paddingLeft = '24px';
                                    } else {
                                        par_new.style.listStyleType = 'disc';
                                        //par_new.style.paddingLeft = '24px';
                                    }
                                    for (let item of par.items) {
                                        let li = document.createElement('li');
                                        li.classList.add(
                                            'article-body__content',
                                            'article-body__content-list',
                                            'font--size-sm-18',
                                            'font--size-md-18',
                                            'font--primary',
                                            'font--myeongjo',
                                            'text--line-height-md'
                                        );
                                        let doc = parser.parseFromString('<span>' + item.content + '</span>', 'text/html');
                                        let span = doc.querySelector('span');
                                        li.appendChild(span);
                                        par_new.appendChild(li);
                                    }
                                }
                            else if (par.type === 'quote') {
                                if (par.content) {
                                    let doc = parser.parseFromString(
                                        '<blockquote style="border-left: 4px solid #333; padding-left: 15px; margin: 20px 0; font-style: italic; color: #444; background: #f9f9f9; padding: 15px;">' + par.content + '</blockquote>',
                                        'text/html'
                                    );
                                    par_new = doc.querySelector('blockquote');
                                }
                            }
                            else if (par.type === 'divider') {
                                par_new = document.createElement('hr');
                                par_new.style.margin = '30px 0';
                                par_new.style.border = '0';
                                par_new.style.borderTop = '1px solid #e0e0e0';
                            }
                            else if (par.type === 'gallery') {
                                if (par.items && par.items.length > 0) {
                                    par_new = document.createElement('div');
                                    par_new.style.margin = '20px 0';
                                    par_new.style.textAlign = 'center';

                                    if (par.title) {
                                        let titleEl = document.createElement('h4');
                                        titleEl.innerText = par.title;
                                        titleEl.style.marginBottom = '15px';
                                        titleEl.style.fontWeight = 'bold';
                                        par_new.appendChild(titleEl);
                                    }

                                    for (let item of par.items) {
                                        if (item.url) {
                                            let img = document.createElement('img');
                                            img.src = item.url;
                                            img.style.maxWidth = '100%';
                                            img.style.height = 'auto';
                                            img.style.borderRadius = '4px';
                                            img.style.marginBottom = '8px';
                                            par_new.appendChild(img);

                                            if (item.caption) {
                                                let cap = document.createElement('p');
                                                cap.innerText = item.caption;
                                                cap.style.fontSize = '0.85em';
                                                cap.style.color = '#666';
                                                cap.style.marginBottom = '20px';
                                                cap.style.lineHeight = '1.4';
                                                par_new.appendChild(cap);
                                            }
                                        }
                                    }
                                } else if (par.content) {
                                    // items가 없고 content만 있는 경우 대비
                                    let doc = parser.parseFromString('<div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 4px;"><strong>[갤러리]</strong><br>' + par.content + '</div>', 'text/html');
                                    par_new = doc.querySelector('div');
                                }
                            }
                            else if (par.type === 'oembed_response') {
                                if (par.html) {
                                    // 임베드 HTML 코드가 직접 포함된 경우
                                    let doc = parser.parseFromString('<div style="margin: 20px 0; text-align: center;">' + par.html + '</div>', 'text/html');
                                    par_new = doc.querySelector('div');
                                } else if (par.url || (par.raw_oembed && par.raw_oembed.url)) {
                                    // URL만 있는 경우 링크로 대체
                                    let embedUrl = par.url || par.raw_oembed.url;
                                    par_new = document.createElement('p');
                                    par_new.style.textAlign = 'center';
                                    par_new.style.margin = '20px 0';
                                    let par_link = document.createElement('a');
                                    par_link.href = embedUrl.replace(/\/$/, '');
                                    par_link.innerText = '🔗 외부 콘텐츠 보기 (' + embedUrl.replace(/\/$/, '') + ')';
                                    par_link.target = '_blank';
                                    par_link.style.color = '#0056b3';
                                    par_link.style.textDecoration = 'underline';
                                    par_new.appendChild(par_link);
                                } else if (par.content) {
                                    let doc = parser.parseFromString('<p>' + par.content + '</p>', 'text/html');
                                    par_new = doc.querySelector('p');
                                }
                            }
                            } else if (!['custom_embed'].includes(par.type)) {
                                console.log(par);
                            } else {
                                alert('!!!!!!!!!NEW TYPE!!!!!!!!!'+el.type);
                                return el.content
                            }
                            if (par_new)
                                article.appendChild(par_new);
                        }
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }

        // 광고 및 기타 요소 숨기기
        //let ads = 'div.footer__ads-footer';
        //hideDOMStyle(ads);

        // bpc_func.js의 전역 함수 실행
        //if (typeof ads_hide === 'function') ads_hide();
        var leaky_paywall_unhide_disable;
        if (!leaky_paywall_unhide_disable && typeof leaky_paywall_unhide === 'function') leaky_paywall_unhide();
    }, 1000);
})();
