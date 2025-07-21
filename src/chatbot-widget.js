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
            
            this.init();
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

                .chatbot-trigger {
                    position: fixed;
                    bottom: 24px;
                    ${this.config.position}: 24px;
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, ${this.config.primaryColor} 0%, ${this.config.secondaryColor} 100%);
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 9998;
                    box-shadow: 0 8px 32px ${this.hexToRgba(this.config.primaryColor, 0.4)};
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .chatbot-trigger:hover {
                    transform: scale(1.1);
                    box-shadow: 0 12px 40px ${this.hexToRgba(this.config.primaryColor, 0.6)};
                    background: linear-gradient(135deg, ${this.darkenColor(this.config.primaryColor, 10)} 0%, ${this.darkenColor(this.config.secondaryColor, 10)} 100%);
                }

                .chatbot-trigger:active {
                    transform: scale(0.95);
                }

                .chatbot-trigger-icon {
                    width: 28px;
                    height: 28px;
                    fill: white;
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
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 9999;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .chatbot-overlay.open {
                    opacity: 1;
                    visibility: visible;
                }

                .chatbot-modal {
                    position: fixed;
                    top: 5%;
                    ${this.config.position === 'left' ? 'left' : 'right'}: 0;
                    width: 30%;
                    height: 90%;
                    background: white;
                    border-radius: 0;
                    box-shadow: ${this.config.position === 'left' ? '10px' : '-10px'} 0 50px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    transform: translateX(${this.config.position === 'left' ? '-100%' : '100%'});
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
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
            this.triggerButton.className = 'chatbot-trigger';
            this.triggerButton.innerHTML = `
                <svg class="chatbot-trigger-icon" viewBox="0 0 24 24" fill="white" stroke="none">
                    <path d="M18 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/>
                    <path d="M4 18h2a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H4"/>
                    <rect x="6" y="6" width="12" height="12" rx="2" fill="white"/>
                    <circle cx="9" cy="10" r="1" fill="#ff6b35"/>
                    <circle cx="15" cy="10" r="1" fill="#ff6b35"/>
                    <rect x="10" y="13" width="4" height="1" rx="0.5" fill="#ff6b35"/>
                </svg>
            `;
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

            // 오버레이 클릭으로 닫기
            this.overlay.addEventListener('click', () => {
                this.closeModal();
            });

            // 닫기 버튼 클릭
            const closeButton = this.modal.querySelector('.chatbot-close');
            closeButton.addEventListener('click', () => {
                this.closeModal();
            });

            // ESC 키로 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeModal();
                }
            });

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
            document.body.style.overflow = 'hidden';
            
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
            document.body.style.overflow = '';
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