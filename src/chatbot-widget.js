(function() {
    'use strict';

    // 위젯이 이미 로드되었는지 확인
    if (window.ChatbotWidget) {
        return;
    }

    class ChatbotWidget {
        constructor(options = {}) {
            // 기본 설정
            this.config = {
                title: options.title || '🤖 AI Navi',
                primaryColor: options.primaryColor || '#ff6b35',
                secondaryColor: options.secondaryColor || '#f7931e',
                chatbotUrl: options.chatbotUrl || 'https://ainavi-dev.meeta.jp/',
                position: options.position || 'right', // 'left' or 'right'
                showTriggerButton: options.showTriggerButton !== false, // 기본값은 true
                ...options
            };

            this.isOpen = false;
            this.triggerButton = null;
            this.modal = null;
            this.overlay = null;
            this.iframe = null;
            this.isMobile = this.checkMobile(); // 모바일 환경 체크
            
            this.init();
        }

        // 모바일 환경 감지
        checkMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            // 스마트폰 감지 (태블릿 제외)
            const isSmartphone = /iPhone|iPod|Android.*Mobile/i.test(userAgent);
            // 화면 크기로도 체크 (스마트폰 기준)
            const isSmallScreen = window.innerWidth <= 480;
            return isSmartphone || isSmallScreen;
        }

        init() {
            // DOM이 로드된 후 위젯 생성
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.createWidget());
            } else {
                this.createWidget();
            }
        }

        createWidget() {
            this.createStyles();
            if (this.config.showTriggerButton) {
                this.createTriggerButton();
            }
            this.createModal();
            this.bindEvents();
            
            // iframe 미리 로드 시작
            this.preloadIframe();
        }

        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .chatbot-widget * {
                    box-sizing: border-box;
                }

                /* PC용 트리거 버튼 - Figma 디자인 */
                .chatbot-trigger {
                    position: fixed;
                    bottom: 24px;
                    ${this.config.position}: 24px;
                    display: inline-flex;
                    height: 60px;
                    align-items: center;
                    gap: 12px;
                    padding: 0 24px;
                    flex-shrink: 0;
                    box-shadow: 1.5px 3px 3px 0 rgba(0, 0, 0, 0.25);
                    border-radius: 22.5px;
                    background: var(--Navi_Orange_Main, #F57C00);
                    border: none;
                    cursor: pointer;
                    z-index: 9998;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    font-family: "Noto Sans", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                /* PC 트리거 버튼 텍스트 */
                .chatbot-trigger-text {
                    color: #FFF;
                    font-size: 21px;
                    font-style: normal;
                    font-weight: 600;
                    line-height: 30px;
                    letter-spacing: 0.6px;
                    white-space: nowrap;
                }

                /* 모바일 스마트폰용 트리거 버튼 스타일 */
                .chatbot-trigger.mobile-trigger {
                    width: 80px;
                    height: 80px;
                    padding: 0;
                    gap: 8px;
                    border-radius: 100px;
                    background: #F97316;
                    box-shadow: 2px 4px 4px 0 rgba(0, 0, 0, 0.25);
                    justify-content: center;
                }
                
                .chatbot-trigger.mobile-trigger .chatbot-trigger-text {
                    display: none;
                }

                .chatbot-trigger.mobile-trigger:hover {
                    transform: none;
                    box-shadow: 2px 4px 4px 0 rgba(0, 0, 0, 0.25);
                    background: #F97316;
                }

                .chatbot-trigger.mobile-trigger .chatbot-trigger-icon {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                }

                .chatbot-trigger:hover {
                    transform: translateY(-2px);
                    box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.3);
                    background: #E65100;
                }

                .chatbot-trigger:active {
                    transform: scale(0.95);
                }

                .chatbot-trigger-icon {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    transition: transform 0.3s ease;
                }

                .chatbot-trigger.open .chatbot-trigger-icon {
                    transform: rotate(180deg);
                }

                .chatbot-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: transparent; /* 투명 배경으로 변경 */
                    z-index: 9999;
                    opacity: 1; /* 항상 투명하게 유지 */
                    visibility: hidden;
                    transition: visibility 0.3s ease;
                    pointer-events: none; /* 클릭 이벤트 차단 */
                }

                .chatbot-overlay.open {
                    visibility: visible;
                }

                .chatbot-modal {
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    ${this.config.position === 'left' ? 'left' : 'right'}: 0;
                    width: 500px;
                    height: 100%;
                    background: white;
                    border-radius: 0;
                    box-shadow: ${this.config.position === 'left' ? '10px' : '-10px'} 0 50px rgba(0, 0, 0, 0.3);
                    z-index: 10001; /* z-index 최적화 */
                    transform: translateX(${this.config.position === 'left' ? '-100%' : '100%'});
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    pointer-events: auto; /* 모달은 클릭 가능 */
                }

                .chatbot-modal.open {
                    transform: translateX(0);
                }

                .chatbot-header {
                    background: white;
                    color: #333;
                    border-bottom: 1px solid #e0e0e0;
                    padding: 8px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                    min-height: 36px;
                }

                .chatbot-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.1;
                }

                .chatbot-close {
                    background: none;
                    border: none;
                    color: #B7B7B7;
                    cursor: pointer;
                    padding: 0;
                    border-radius: 0;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    opacity: 1;
                }

                .chatbot-close:hover {
                    color: #999;
                    transform: scale(1.05);
                }

                .chatbot-close:active {
                    transform: scale(0.95);
                    color: #666;
                }

                .chatbot-close-icon {
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                    stroke: none;
                    flex-shrink: 0;
                }

                .chatbot-content {
                    flex: 1;
                    overflow: hidden;
                    border-radius: 0;
                }

                .chatbot-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: #f8f9fa;
                    border-radius: 0;
                }

                .chatbot-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #666;
                }

                .chatbot-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid ${this.config.primaryColor};
                    border-radius: 50%;
                    animation: chatbot-spin 1s linear infinite;
                    margin-right: 12px;
                }

                @keyframes chatbot-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* 모바일 반응형 */
                @media (max-width: 768px) {
                    .chatbot-modal {
                        width: 100%;
                        top: 10%;
                        height: 90%;
                        border-radius: 0;
                        ${this.config.position}: 0;
                        transform: translateY(100%);
                    }
                    
                    .chatbot-modal.open {
                        transform: translateY(0);
                    }
                    
                    .chatbot-trigger {
                        bottom: 20px;
                        ${this.config.position}: 20px;
                        width: 56px;
                        height: 56px;
                    }
                    
                    .chatbot-trigger-icon {
                        width: 24px;
                        height: 24px;
                    }

                    .chatbot-header {
                        padding: 6px 12px;
                        min-height: 32px;
                    }

                    .chatbot-title {
                        font-size: 13px;
                    }
                }

                @media (max-width: 480px) {
                    .chatbot-modal {
                        top: 0;
                        height: 100%;
                        border-radius: 0;
                    }
                    
                    .chatbot-content {
                        border-radius: 0;
                    }
                    
                    .chatbot-iframe {
                        border-radius: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createTriggerButton() {
            this.triggerButton = document.createElement('button');
            this.triggerButton.className = this.isMobile ? 'chatbot-trigger mobile-trigger' : 'chatbot-trigger';
            
            // 모바일용 아이콘
            if (this.isMobile) {
                this.triggerButton.innerHTML = `
                    <svg class="chatbot-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
            } else {
                // PC용 Figma 디자인 아이콘 + 텍스트
                this.triggerButton.innerHTML = `
                    <svg class="chatbot-trigger-icon" xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
                        <g clip-path="url(#clip0_870_3324)">
                            <path d="M12.4995 1.17432C12.9551 1.17432 13.3246 1.54394 13.3247 1.99951V4.99951C13.3247 5.45515 12.9551 5.82471 12.4995 5.82471C12.0441 5.82446 11.6743 5.45499 11.6743 4.99951V2.82471H8.49951C8.04409 2.82446 7.67432 2.45499 7.67432 1.99951C7.67439 1.54409 8.04413 1.17456 8.49951 1.17432H12.4995Z" fill="white"/>
                            <path d="M18.5 5.25C19.2293 5.25 19.9286 5.53994 20.4443 6.05566C20.9601 6.57139 21.25 7.27065 21.25 8V16C21.25 16.7293 20.9601 17.4286 20.4443 17.9443C19.9286 18.4601 19.2293 18.75 18.5 18.75H8.81055L5.03027 22.5303C4.81579 22.7448 4.49313 22.8094 4.21289 22.6934C3.93263 22.5773 3.75 22.3033 3.75 22V8C3.75 7.27065 4.03994 6.57139 4.55566 6.05566C5.07139 5.53994 5.77065 5.25 6.5 5.25H18.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3.5 11.4375C3.81066 11.4375 4.0625 11.6893 4.0625 12C4.0625 12.3107 3.81066 12.5625 3.5 12.5625H1.5C1.18934 12.5625 0.9375 12.3107 0.9375 12C0.9375 11.6893 1.18934 11.4375 1.5 11.4375H3.5Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8.9375 13V11C8.9375 10.6893 9.18934 10.4375 9.5 10.4375C9.81066 10.4375 10.0625 10.6893 10.0625 11V13C10.0625 13.3107 9.81066 13.5625 9.5 13.5625C9.18934 13.5625 8.9375 13.3107 8.9375 13Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14.9375 13V11C14.9375 10.6893 15.1893 10.4375 15.5 10.4375C15.8107 10.4375 16.0625 10.6893 16.0625 11V13C16.0625 13.3107 15.8107 13.5625 15.5 13.5625C15.1893 13.5625 14.9375 13.3107 14.9375 13Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23.5 11.4375L23.6133 11.4492C23.8696 11.5017 24.0625 11.7282 24.0625 12C24.0625 12.2718 23.8696 12.4983 23.6133 12.5508L23.5 12.5625H21.5C21.1893 12.5625 20.9375 12.3107 20.9375 12C20.9375 11.6893 21.1893 11.4375 21.5 11.4375H23.5Z" stroke="white" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                        <defs>
                            <clipPath id="clip0_870_3324">
                                <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
                            </clipPath>
                        </defs>
                    </svg>
                    <span class="chatbot-trigger-text">AIチャットサポート</span>
                `;
            }
            
            this.triggerButton.setAttribute('aria-label', '챗봇 열기');
            document.body.appendChild(this.triggerButton);
        }

        createModal() {
            // 오버레이 생성
            this.overlay = document.createElement('div');
            this.overlay.className = 'chatbot-overlay';
            
            // 모달 생성
            this.modal = document.createElement('div');
            this.modal.className = 'chatbot-modal';
            
            // 헤더 생성
            const header = document.createElement('div');
            header.className = 'chatbot-header';
            header.innerHTML = `
                <h3 class="chatbot-title">${this.config.title}</h3>
                <button class="chatbot-close" aria-label="챗봇 닫기" title="챗봇 닫기">
                    <svg class="chatbot-close-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4.99422 3.90637C4.73832 3.90637 4.47072 3.99238 4.27542 4.18738C3.88492 4.57838 3.88492 5.23437 4.27542 5.62537L10.5567 11.9064L4.27542 18.1874C3.88492 18.5784 3.88492 19.2344 4.27542 19.6254C4.66602 20.0154 5.32242 20.0154 5.71302 19.6254L11.9942 13.3444L18.2754 19.6254C18.666 20.0154 19.3224 20.0154 19.713 19.6254C20.1035 19.2344 20.1035 18.5784 19.713 18.1874L13.4317 11.9064L19.713 5.62537C20.1035 5.23437 20.1035 4.57838 19.713 4.18738C19.5177 3.99238 19.25 3.90637 18.9942 3.90637C18.7383 3.90637 18.4708 3.99238 18.2754 4.18738L11.9942 10.4684L5.71302 4.18738C5.51772 3.99238 5.25012 3.90637 4.99422 3.90637Z" fill="currentColor"/>
                    </svg>
                </button>
            `;
            
            // 콘텐츠 영역 생성
            const content = document.createElement('div');
            content.className = 'chatbot-content';
            content.innerHTML = `
                <div class="chatbot-loading">
                    <div class="chatbot-spinner"></div>
                    チャットボットを読み込み中です...
                </div>
            `;
            
            this.modal.appendChild(header);
            this.modal.appendChild(content);
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.modal);
        }

        bindEvents() {
            // 트리거 버튼 클릭 (버튼이 있을 때만)
            if (this.triggerButton) {
                this.triggerButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleModal();
                });
            }

            // 오버레이 클릭으로 닫기 - 제거됨
            // this.overlay.addEventListener('click', () => {
            //     this.closeModal();
            // });

            // 닫기 버튼 클릭
            const closeButton = this.modal.querySelector('.chatbot-close');
            closeButton.addEventListener('click', () => {
                this.closeModal();
            });

            // ESC 키로 닫기 - 제거됨 (닫기 버튼만 사용)
            // document.addEventListener('keydown', (e) => {
            //     if (e.key === 'Escape' && this.isOpen) {
            //         this.closeModal();
            //     }
            // });

            // 모달 내부 클릭 시 이벤트 전파 방지
            this.modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // 링크 클릭으로 모달 열기
            this.bindLinkTriggers();
        }

        preloadIframe() {
            // 숨겨진 iframe을 미리 생성하여 로딩 시작
            this.iframe = document.createElement('iframe');
            this.iframe.className = 'chatbot-iframe';
            this.iframe.src = this.config.chatbotUrl;
            this.iframe.setAttribute('allow', 'microphone; camera');
            this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
            this.iframe.style.display = 'none';
            
            // 미리 로드 완료 표시
            this.iframe.onload = () => {
                this.isIframePreloaded = true;
            };
            
            // body에 숨겨진 상태로 추가하여 미리 로딩
            document.body.appendChild(this.iframe);
        }

        bindLinkTriggers() {
            // 기존 링크들에 이벤트 바인딩
            this.attachLinkEvents();
            
            // DOM 변화 감지해서 새로운 링크들에도 자동 바인딩
            this.linkObserver = new MutationObserver(() => {
                this.attachLinkEvents();
            });
            
            this.linkObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        attachLinkEvents() {
            // data-chatbot-trigger 속성을 가진 모든 요소
            const triggers = document.querySelectorAll('[data-chatbot-trigger]');
            
            triggers.forEach(trigger => {
                // 이미 이벤트가 바인딩된 요소는 스킵
                if (trigger.hasAttribute('data-chatbot-bound')) return;
                
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal();
                });
                
                // 바인딩 완료 표시
                trigger.setAttribute('data-chatbot-bound', 'true');
            });
            
            // 클래스 기반 트리거
            const classTriggers = document.querySelectorAll('.chatbot-trigger-link');
            
            classTriggers.forEach(trigger => {
                if (trigger.hasAttribute('data-chatbot-bound')) return;
                
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal();
                });
                
                trigger.setAttribute('data-chatbot-bound', 'true');
            });
        }

        toggleModal() {
            if (this.isOpen) {
                this.closeModal();
            } else {
                this.openModal();
            }
        }

        openModal() {
            this.isOpen = true;
            if (this.triggerButton) {
                this.triggerButton.classList.add('open');
            }
            this.overlay.classList.add('open');
            this.modal.classList.add('open');
            // document.body.style.overflow = 'hidden'; // Body 스크롤 잠금 제거
            
            // 미리 로드된 iframe 사용 또는 새로 로드
            if (this.iframe && this.isIframePreloaded) {
                this.showPreloadedIframe();
            } else {
                this.loadChatbot();
            }
        }

        closeModal() {
            this.isOpen = false;
            if (this.triggerButton) {
                this.triggerButton.classList.remove('open');
            }
            this.overlay.classList.remove('open');
            this.modal.classList.remove('open');
            // document.body.style.overflow = ''; // Body 스크롤 잠금 해제 제거
        }

        showPreloadedIframe() {
            const content = this.modal.querySelector('.chatbot-content');
            const loading = content.querySelector('.chatbot-loading');
            
            if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => {
                    if (loading.parentNode) {
                        content.removeChild(loading);
                    }
                    
                    // 미리 로드된 iframe을 모달에 이동
                    this.iframe.style.display = 'block';
                    this.iframe.style.opacity = '0';
                    content.appendChild(this.iframe);
                    
                    setTimeout(() => {
                        this.iframe.style.transition = 'opacity 0.3s ease';
                        this.iframe.style.opacity = '1';
                    }, 50);
                }, 200);
            }
        }

        loadChatbot() {
            const content = this.modal.querySelector('.chatbot-content');
            let isLoaded = false;
            
            // iframe 생성 (아직 없는 경우만)
            if (!this.iframe) {
                this.iframe = document.createElement('iframe');
                this.iframe.className = 'chatbot-iframe';
                this.iframe.src = this.config.chatbotUrl;
                this.iframe.setAttribute('allow', 'microphone; camera');
                this.iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
            }
            
            const showIframe = () => {
                if (isLoaded) return;
                isLoaded = true;
                
                const loading = content.querySelector('.chatbot-loading');
                if (loading) {
                    loading.style.opacity = '0';
                    setTimeout(() => {
                        if (loading.parentNode) {
                            content.removeChild(loading);
                        }
                        content.appendChild(this.iframe);
                        this.iframe.style.opacity = '0';
                        setTimeout(() => {
                            this.iframe.style.transition = 'opacity 0.3s ease';
                            this.iframe.style.opacity = '1';
                        }, 50);
                    }, 300);
                }
            };
            
            // 로딩 완료 후 로딩 화면 제거
            this.iframe.onload = () => {
                console.log('iframe loaded successfully');
                showIframe();
            };

            // 타임아웃으로 강제 로딩 완료 (3초 후)
            setTimeout(() => {
                if (!isLoaded) {
                    showIframe();
                }
            }, 3000);

            // 에러 처리
            this.iframe.onerror = () => {
                content.innerHTML = `
                    <div class="chatbot-loading">
                        <div style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                            <div style="font-size: 16px; color: #666; margin-bottom: 8px;">チャットボットを読み込めません</div>
                            <div style="font-size: 14px; color: #999;">ネットワーク接続を確認してください</div>
                        </div>
                    </div>
                `;
            };
        }

        // 유틸리티 함수들
        hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        darkenColor(hex, percent) {
            const num = parseInt(hex.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        }
    }

    // 전역 객체에 등록
    window.ChatbotWidget = ChatbotWidget;

    // 자동 초기화 
    // DOM이 완전히 로드된 후 초기화하여 window.chatbotWidgetOptions를 확인
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.chatbotWidgetInstance) {
                if (window.chatbotWidgetOptions) {
                    window.chatbotWidgetInstance = new ChatbotWidget(window.chatbotWidgetOptions);
                } else {
                    window.chatbotWidgetInstance = new ChatbotWidget();
                }
            }
        });
    } else {
        if (!window.chatbotWidgetInstance) {
            if (window.chatbotWidgetOptions) {
                window.chatbotWidgetInstance = new ChatbotWidget(window.chatbotWidgetOptions);
            } else {
                window.chatbotWidgetInstance = new ChatbotWidget();
            }
        }
    }
})();